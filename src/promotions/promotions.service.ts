import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Promotion } from './promotions.entity';
import { response } from '../utils/response';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Promotion)
    private repo: Repository<Promotion>,
  ) {}

  create(data: Partial<Promotion>) {
    const promotion = this.repo.create(data);
    return this.repo.save(promotion);
  }

  async findAll(): Promise<object> {
    const data = await this.repo.find();
    return response(200, 'OK', data);
  }
}
