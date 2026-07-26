import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenants.entity';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { response } from '../utils/response';
import {
  SubscriptionPlan,
  PlanCycle,
} from '../subscriptions/entities/subscription-plan.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../subscriptions/entities/subscription.entity';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
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
}
