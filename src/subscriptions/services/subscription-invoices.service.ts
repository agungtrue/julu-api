import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  SubscriptionInvoice,
  InvoiceStatus,
  PaymentMethods,
} from '../entities/subscription-invoice.entity';
import { SubscriptionPlan } from '../entities/subscription-plan.entity';
import { Tenant } from '../../tenants/tenants.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import { SubscriptionsService } from './subscriptions.service';
import { CheckoutInvoiceDto } from '../dto/checkout-invoice.dto';

@Injectable()
export class SubscriptionInvoicesService {
  constructor(
    @InjectRepository(SubscriptionInvoice)
    private readonly invoiceRepo: Repository<SubscriptionInvoice>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    private readonly subService: SubscriptionsService,
  ) {}

  /**
   * ⚡ 100% ANTI-DUPLICATE INVOICE NUMBER GENERATOR
   */
  private async generateInvoiceNumber(manager: EntityManager): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const yearMonth = `${year}${month}`;
    const prefix = `INV-JULU-${yearMonth}-`;

    const lastInvoice = await manager
      .createQueryBuilder(SubscriptionInvoice, 'invoice')
      .setLock('pessimistic_write') // 🔒 Kunci baris agar transaksi sejenis mengantre
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('invoice.createdAt', 'DESC')
      .getOne();

    let nextSequence = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const lastSeqStr = lastInvoice.invoiceNumber.replace(prefix, '');
      const lastSeq = parseInt(lastSeqStr, 10);
      if (!isNaN(lastSeq)) {
        nextSequence = lastSeq + 1;
      }
    }

    const paddedSequence = String(nextSequence).padStart(4, '0');
    return `${prefix}${paddedSequence}`;
  }

  /**
   * 1. Process Checkout dari UI Billing Tenant
   */
  async checkout(tenantId: string, dto: CheckoutInvoiceDto) {
    const plan = await this.planRepo.findOne({ where: { id: dto?.planId } });
    if (!plan || !plan.isActive) {
      throw new NotFoundException(
        'Paket langganan tidak valid atau tidak aktif.',
      );
    }

    return await this.invoiceRepo.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. CARI RECORD SUBSCRIPTION TENANT SAAT INI
        let currentSub = await transactionalEntityManager.findOne(
          Subscription,
          {
            where: { tenantId },
            order: { createdAt: 'DESC' },
          },
        );

        // 2. FALLBACK: Jika tenant benar-benar baru & belum punya record Subscription sama sekali
        if (!currentSub) {
          currentSub = transactionalEntityManager.create(Subscription, {
            tenantId,
            planId: plan.id,
            status: SubscriptionStatus.EXPIRED,
            startDate: new Date(),
            endDate: new Date(),
          });

          // Simpan ke database, setelah ini currentSub.id PASTI TERISI (UUID)
          currentSub = await transactionalEntityManager.save(
            Subscription,
            currentSub,
          );
        }

        // A. Generate Nomor Invoice Unik
        const invoiceNumber = await this.generateInvoiceNumber(
          transactionalEntityManager,
        );

        // B. Buat Record Invoice PENDING
        const invoice = transactionalEntityManager.create(SubscriptionInvoice, {
          invoiceNumber,
          tenantId,
          subscriptionId: currentSub.id,
          planId: plan.id,
          amount: plan.price,
          status: InvoiceStatus.PENDING,
          paymentMethod: dto.paymentMethod || PaymentMethods.BANK_TRANSFER,
          dueDate: new Date(),
        });

        const savedInvoice = await transactionalEntityManager.save(invoice);

        // C. Tentukan Teks Format WhatsApp untuk Tombol di UI
        const waMessage = encodeURIComponent(
          `Halo Admin Julu POS, saya ingin konfirmasi perpanjangan paket langganan.\n\n` +
            `*No. Invoice:* ${savedInvoice.invoiceNumber}\n` +
            `*Paket:* ${plan.name}\n` +
            `*Total:* Rp ${Number(plan.price).toLocaleString('id-ID')}\n\n` +
            `Mohon bantuannya untuk diproses. Terima kasih!`,
        );

        return {
          invoice: savedInvoice,
          plan,
          whatsappUrl: `https://wa.me/6281234567890?text=${waMessage}`, // Sesuaikan nomor WA Admin
        };
      },
    );
  }

  /**
   * 2. Approve Invoice (Oleh Super Admin / Webhook Payment Gateway)
   */
  async approveInvoice(invoiceId: string) {
    return await this.invoiceRepo.manager.transaction(
      async (transactionalEntityManager) => {
        const invoice = await transactionalEntityManager.findOne(
          SubscriptionInvoice,
          {
            where: { id: invoiceId },
            relations: ['plan'],
          },
        );

        if (!invoice) {
          throw new NotFoundException('Invoice tidak ditemukan.');
        }

        if (invoice.status === InvoiceStatus.PAID) {
          throw new BadRequestException(
            'Invoice ini sudah dibayar sebelumnya.',
          );
        }

        // A. Update Status Invoice
        invoice.status = InvoiceStatus.PAID;
        invoice.paidAt = new Date();
        await transactionalEntityManager.save(invoice);

        // B. Perbarui / Perpanjang Masa Aktif Subscription Tenant
        const updatedSubscription = await this.subService.renewSubscription(
          {
            tenantId: invoice.tenantId,
            planId: invoice.planId,
          },
          transactionalEntityManager,
        );

        return {
          message:
            'Pembayaran berhasil dikonfirmasi & Paket langganan telah aktif!',
          invoice,
          subscription: updatedSubscription,
        };
      },
    );
  }

  /**
   * 3. Ambil Riwayat Invoice Milik Tenant
   */
  async getTenantInvoices(tenantId: string) {
    return await this.invoiceRepo.find({
      where: { tenantId },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async getInvoiceByNumber(tenantId: string, invoiceNumber: string) {
    const invoice = await this.invoiceRepo.findOne({
      where: { invoiceNumber, tenantId },
      relations: ['plan'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice pembayaran tidak ditemukan.');
    }

    const waMessage = encodeURIComponent(
      `Halo Admin Julu POS, saya ingin konfirmasi pembayaran.\n\n` +
        `*No. Invoice:* ${invoice.invoiceNumber}\n` +
        `*Paket:* ${invoice.plan?.name}\n` +
        `*Total:* Rp ${Number(invoice.amount).toLocaleString('id-ID')}\n\n` +
        `Mohon bantuannya untuk diproses. Terima kasih!`,
    );

    return {
      ...invoice,
      whatsappUrl: `https://wa.me/6287769675686?text=${waMessage}`,
    };
  }

  async getInvoicesForAdmin(status) {
    return await this.invoiceRepo.find({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { status },
      relations: ['tenant', 'plan'], // Load relasi tenant & plan agar Admin tahu siapa yang bayar
      order: { createdAt: 'DESC' },
    });
  }

  async getLatestPendingInvoice(tenantId: string) {
    return await this.invoiceRepo.findOne({
      where: { tenantId, status: InvoiceStatus.PENDING },
      relations: ['plan'],
      order: { createdAt: 'DESC' },
    });
  }

  // services/subscription-invoices.service.ts

  async getAdminDashboardStats() {
    // 1. Total Omzet Seluruhnya
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const totalRevResult = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.amount)', 'total')
      .where('inv.status = :status', { status: InvoiceStatus.PAID })
      .getRawOne();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const monthlyRevResult = await this.invoiceRepo
      .createQueryBuilder('inv')
      .select('SUM(inv.amount)', 'total')
      .where('inv.status = :status', { status: InvoiceStatus.PAID })
      .andWhere('inv.paidAt >= :startOfMonth', { startOfMonth })
      .getRawOne();

    // 3. Count Pending Invoices
    const pendingCount = await this.invoiceRepo.count({
      where: { status: InvoiceStatus.PENDING },
    });

    // 4. Count Tenant Matrix (Misal memanggil repo Tenant/Subscription)
    const totalTenants = await this.tenantRepo.count();
    const activeTenants = await this.subRepo.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // 5. Transaksi Terbaru (Limit 5)
    const recentTransactions = await this.invoiceRepo.find({
      relations: ['tenant', 'plan'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalRevenue: parseFloat(totalRevResult?.total || 0),
      monthlyRevenue: parseFloat(monthlyRevResult?.total || 0),
      totalTenants,
      activeTenants,
      expiredTenants: totalTenants - activeTenants,
      pendingInvoicesCount: pendingCount,
      planBreakdown: [], // Bisa tambahkan GROUP BY planId jika diperlukan
      recentTransactions: recentTransactions.map((tx) => ({
        id: tx.id,
        invoiceNumber: tx.invoiceNumber,
        tenantName: tx.tenant?.name || 'Tenant',
        planName: tx.plan?.name || 'Paket',
        amount: tx.amount,
        status: tx.status,
        createdAt: tx.createdAt,
      })),
    };
  }
}
