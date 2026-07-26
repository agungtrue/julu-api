import {
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import {
  Subscription,
  SubscriptionStatus,
} from '../entities/subscription.entity';
import {
  SubscriptionPlan,
  PlanCycle,
} from '../entities/subscription-plan.entity';
import { RenewSubscriptionDto } from '../dto/renew-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
  ) {}

  /**
   * 1. Ambil Status Langganan Aktif milik Tenant saat ini
   */
  async getTenantSubscription(tenantId: string): Promise<Subscription> {
    console.log({ tenantId });
    const subscription = await this.subRepo.findOne({
      where: { tenantId },
      relations: ['plan', 'tenant'],
      order: { createdAt: 'DESC' },
    });

    if (!subscription) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED, // 402
          errorCode: 'SUBSCRIPTION_NOT_FOUND',
          message: 'Data langganan untuk tenant ini tidak ditemukan.',
          redirectTo: '/billing',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Dynamic Check Expired saat di-query
    const now = new Date();
    if (
      subscription.status !== SubscriptionStatus.EXPIRED &&
      subscription.endDate < now
    ) {
      subscription.status = SubscriptionStatus.EXPIRED;
      await this.subRepo.save(subscription);
    }

    return subscription;
  }

  /**
   * 2. Buat Uji Coba Gratis (Trial) Otomatis saat Registrasi Tenant Baru
   */
  async createTrialSubscription(
    tenantId: string,
    planId: string,
    trialDays: number = 14,
    manager?: EntityManager,
  ): Promise<Subscription> {
    const repo = manager ? manager.getRepository(Subscription) : this.subRepo;
    const planRepo = manager
      ? manager.getRepository(SubscriptionPlan)
      : this.planRepo;

    const plan = await planRepo.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan tidak ditemukan');

    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

    const subscription = repo.create({
      tenantId,
      planId: plan.id,
      status: SubscriptionStatus.TRIALING,
      startDate: now,
      endDate: trialEndsAt,
      trialEndsAt,
    });

    return await repo.save(subscription);
  }

  /**
   * 3. Core Logic Perpanjangan / Renewal Paket Langganan
   */
  async renewSubscription(
    renewDto: RenewSubscriptionDto,
    manager?: EntityManager,
  ): Promise<Subscription> {
    const repo = manager ? manager.getRepository(Subscription) : this.subRepo;
    const planRepo = manager
      ? manager.getRepository(SubscriptionPlan)
      : this.planRepo;

    // A. Cari Paket yang Dibeli
    const plan = await planRepo.findOne({ where: { id: renewDto.planId } });
    if (!plan) {
      throw new NotFoundException('Paket langganan tidak ditemukan.');
    }

    // B. Cari Langganan Tenant Sekarang
    let currentSub = await repo.findOne({
      where: { tenantId: renewDto.tenantId },
      order: { createdAt: 'DESC' },
    });

    const now = new Date();
    let newStartDate: Date;
    let newEndDate: Date;

    // C. Kalkulasi Tanggal (Handling Skenario ACTIVE vs EXPIRED)
    if (
      currentSub &&
      currentSub.status === SubscriptionStatus.ACTIVE &&
      currentSub.endDate > now
    ) {
      // Skenario 1: Masih Aktif -> Perpanjang mulai dari endDate lama (User tidak rugi sisa hari)
      newStartDate = currentSub.startDate;
      newEndDate = new Date(currentSub.endDate);
    } else {
      // Skenario 2: Sudah Expired / Trial -> Mulai dari HARI INI
      newStartDate = now;
      newEndDate = new Date(now);
    }

    // D. Tambahkan durasi sesuai Cycle paket
    if (
      plan.cycle === PlanCycle.DAILY ||
      plan.cycle === PlanCycle.TRIAL ||
      plan.cycle === PlanCycle.CUSTOM
    ) {
      newEndDate.setDate(newEndDate.getDate() + (plan.durationDays || 30));
    } else {
      // MONTHLY, QUARTERLY, SEMI_ANNUALLY, YEARLY -> Gunakan Tambah Bulan Presisi
      newEndDate.setMonth(newEndDate.getMonth() + (plan.monthsCount || 1));
    }

    // E. Save / Update
    if (!currentSub) {
      currentSub = repo.create({
        tenantId: renewDto.tenantId,
        planId: plan.id,
        status: renewDto.status || SubscriptionStatus.ACTIVE,
        startDate: newStartDate,
        endDate: newEndDate,
      });
    } else {
      currentSub.planId = plan.id;
      currentSub.status = renewDto.status || SubscriptionStatus.ACTIVE;
      currentSub.startDate = newStartDate;
      currentSub.endDate = newEndDate;
    }

    return await repo.save(currentSub);
  }
}
