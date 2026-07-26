import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './products.entity';
import { response } from '../utils/response';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private repo: Repository<Product>,
  ) {}

  create(data: Partial<Product>, user: any) {
    const tenantId = user.tenantId
    const product = this.repo.create({
      ...data,
      tenantId,
    });
    return this.repo.save(product);
  }

  async update(id: string, data: Partial<Product>) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return await this.repo.save(data);
  }

  async findAll(withIngredients = false, user: any): Promise<object> {
    const tenantId = user.tenantId
    const query: any = {
      where: {
        isActive: true,
        tenantId
      },
    };
    if (withIngredients) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      query.relations = {
        productIngredients: {
          ingredient: true,
        },
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      query.order = {
        id: 'ASC',
      };
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const data = await this.repo.find(query);
    return response(200, 'OK', data);
  }
}
