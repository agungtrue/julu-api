import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SubscriptionPlan,
  PlanCycle,
} from '../entities/subscription-plan.entity';
import { CreatePlanDto } from '../dto/create-plan.dto';
import { UpdatePlanDto } from '../dto/update-plan.dto';
import { response } from '../../utils/response';

export interface PlanWithNormalPrice extends SubscriptionPlan {
  normalPrice: number;
}

@Injectable()
export class SubscriptionPlansService {
  constructor(
    @InjectRepository(SubscriptionPlan)
    private readonly planRepo: Repository<SubscriptionPlan>,
  ) {}

  async create(createPlanDto: CreatePlanDto): Promise<SubscriptionPlan> {
    const plan = this.planRepo.create(createPlanDto);
    return await this.planRepo.save(plan);
  }

  async findAll(onlyActive: boolean = true) {
    const where = onlyActive ? { isActive: true } : {};
    const plans = await this.planRepo.find({
      where,
      order: { price: 'ASC' },
    });

    const data = this.mapPayload(
      plans.filter((plan) => plan.cycle !== PlanCycle.TRIAL),
    );

    return response(200, 'OK', data);
  }

  async findOne(id: string): Promise<SubscriptionPlan> {
    const plan = await this.planRepo.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(
        `Paket langganan dengan ID ${id} tidak ditemukan.`,
      );
    }
    return plan;
  }

  async update(
    id: string,
    updatePlanDto: UpdatePlanDto,
  ): Promise<SubscriptionPlan> {
    const plan = await this.findOne(id);
    const updatedPlan = this.planRepo.merge(plan, updatePlanDto);
    return await this.planRepo.save(updatedPlan);
  }

  async remove(id: string): Promise<{ message: string }> {
    const plan = await this.findOne(id);
    // Soft disable daripada hapus fisik untuk menjaga integritas riwayat transaksi
    plan.isActive = false;
    await this.planRepo.save(plan);
    return { message: `Paket '${plan.name}' berhasil dinonaktifkan.` };
  }

  private mapPayload(plans: SubscriptionPlan[]): PlanWithNormalPrice[] {
    return plans.map((plan) => {
      let adjust = {
        normalPrice: Number(plan.price),
        duration: '1 Bulan',
        savings: 'Harga Coret Promo',
        tag: '',
      };
      const BASE_MONTHLY_NORMAL_PRICE = 149000;

      switch (plan.cycle) {
        case PlanCycle.MONTHLY:
          adjust.normalPrice = BASE_MONTHLY_NORMAL_PRICE; // Rp 149.000
          adjust.duration = '1 bulan';
          adjust.savings = 'Hemat Rp 60.000';
          adjust.tag = 'COCOK UNTUK UJI COBA';
          break;

        case PlanCycle.QUARTERLY:
          adjust.normalPrice = BASE_MONTHLY_NORMAL_PRICE * 3; // Rp 447.000 (atau sesuaikan dengan hitungan Anda)
          adjust.duration = '3 bulan';
          adjust.savings = 'Hemat Rp 198.000';
          adjust.tag = 'HEMAT 1 BULAN';
          break;

        case PlanCycle.SEMI_ANNUALLY:
          adjust.normalPrice = BASE_MONTHLY_NORMAL_PRICE * 6; // Rp 894.000
          adjust.duration = '6 bulan';
          adjust.savings = 'Hemat Rp 445.000';
          adjust.tag = 'HEMAT 3 BULAN';
          break;

        case PlanCycle.YEARLY:
          adjust.normalPrice = BASE_MONTHLY_NORMAL_PRICE * 12; // Rp 1.788.000
          adjust.duration = '12 bulan';
          adjust.savings = 'Hemat Rp 989.000';
          adjust.tag = 'HEMAT 6 BULAN';
          break;

        case PlanCycle.DAILY:
        case PlanCycle.CUSTOM:
        default:
          // Jika tidak ada promo/diskon khusus, adjust.normalPrice = price
          adjust.normalPrice = Number(plan.price);
          break;
      }

      return {
        ...plan,
        ...adjust
      };
    });
  }
}
