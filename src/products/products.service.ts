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

  create(data: Partial<Product>) {
    const product = this.repo.create(data);
    return this.repo.save(product);
  }

  async update(id: number, data: Partial<Product>) {
    const product = await this.repo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');
    return await this.repo.save(data);
  }

  async findAll(withIngredients = false): Promise<object> {
    const query: any = {
      where: {
        isActive: true,
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
