import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenants.entity';
import { StoreSpecialDays } from './entities/store-special-days.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { response } from '../utils/response';
import {
  SubscriptionPlan,
  PlanCycle,
} from '../subscriptions/entities/subscription-plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';
import { ToggleStoreStatusDto } from './dto/toggle-store-status.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(StoreSpecialDays)
    private readonly storeSpecialDays: Repository<StoreSpecialDays>,
  ) {}
  async create(dto: CreateTenantDto): Promise<Tenant> {
    return await this.tenantRepo.manager.transaction(async (manager) => {
      const tenant = manager.create(Tenant, dto);
      const savedTenant = await manager.save(Tenant, tenant);

      const trialPlan = await manager.findOne(SubscriptionPlan, {
        where: { cycle: PlanCycle.TRIAL },
      });

      if (!trialPlan) {
        throw new BadRequestException('Paket Trial belum dikonfigurasi.');
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + trialPlan.durationDays); // +14 hari

      const subscription = manager.create(Subscription, {
        tenantId: savedTenant.id,
        planId: trialPlan.id,
        status: SubscriptionStatus.TRIALING, // Status langganan: TRIALING
        startDate,
        endDate,
      });
      await manager.save(Subscription, subscription);

      return savedTenant;
    });
  }

  // =======================================================
  // UPDATE TENANT
  // =======================================================
  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');

    Object.assign(tenant, dto);
    return this.tenantRepo.save(tenant);
  }

  // =======================================================
  // CHECK EXPIRY LOGIC
  // =======ExtendPackageDto===============================================
  // Fungsi untuk melihat status spesifik 1 tenant + update status otomatis di DB jika kedaluwarsa
  async getStatus(id: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant tidak ditemukan');

    return response(200, 'OK', [tenant]);
  }

  async findAll(user): Promise<object> {
    // const tenantId = user?.tenantId
    const data = await this.tenantRepo
      .createQueryBuilder('tenant')
      .leftJoinAndSelect('tenant.user', 'user', 'user.role = :role', {
        role: 'OWNER_ADMIN',
      })
      .leftJoinAndSelect('tenant.subscriptions', 'subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')

      .leftJoinAndSelect(
        'tenant.subscriptionInvoices',
        'invoice',
        'invoice.id = (SELECT inv.id FROM subscription_invoices inv WHERE inv."tenantId" = tenant.id ORDER BY inv."createdAt" DESC LIMIT 1)',
      )
      .orderBy('tenant.created_at', 'DESC')
      .addOrderBy('subscription.createdAt', 'DESC')
      .getMany();
    return response(200, 'OK', data);
  }

  async getTodayStatus(tenantId: string, targetDateStr?: string) {
    const dateStr =
      targetDateStr ||
      new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' });

    const specialDay = await this.storeSpecialDays.findOne({
      where: { tenantId, date: dateStr },
    });

    // console.log({ dateStr });
    // console.log({ specialDay });

    if (specialDay) {
      return {
        date: dateStr,
        isOpen: specialDay.isOpen,
        isOverride: true,
        reason: specialDay.reason,
      };
    }

    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['id', 'operating_days'],
    });

    const operatingDays = tenant?.operating_days || [1, 2, 3, 4, 5, 6, 0];

    const targetDow = new Date(dateStr).getDay();
    const isOpenBySchedule = operatingDays.includes(targetDow);

    return {
      date: dateStr,
      isOpen: isOpenBySchedule,
      isOverride: false,
      reason: isOpenBySchedule
        ? 'Jadwal operasional rutin'
        : 'Hari libur rutin',
    };
  }

  async toggleTodayStatus(
    tenantId: string,
    userId: string,
    dto: ToggleStoreStatusDto,
  ) {
    const todayStr = new Date().toLocaleDateString('sv-SE', {
      timeZone: 'Asia/Jakarta',
    });

    await this.storeSpecialDays.upsert(
      {
        tenantId,
        date: todayStr,
        isOpen: dto.isOpen,
        reason: dto.reason || 'Manual override via Dashboard',
        updatedBy: { id: userId },
      },
      ['tenantId', 'date'],
    );

    return {
      message: `Status toko hari ini (${todayStr}) berhasil diubah menjadi ${dto.isOpen ? 'BUKA' : 'TUTUP'}.`,
      isOpen: dto.isOpen,
    };
  }

  async getSettings(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
      select: ['id', 'name', 'daily_opex', 'operating_days', 'receiptFooter'],
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    return tenant;
  }

  async updateSettings(tenantId: string, dto: UpdateTenantSettingsDto) {
    const tenant = await this.tenantRepo.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant tidak ditemukan');
    }

    if (dto?.operating_days !== undefined) {
      tenant.operating_days = dto.operating_days.sort((a, b) => a - b);
    }

    await this.tenantRepo.save(tenant);

    return {
      message: 'Pengaturan hari operasional berhasil diperbarui',
      data: {
        daily_opex: tenant.daily_opex,
        operating_days: tenant.operating_days,
      },
    };
  }
}
