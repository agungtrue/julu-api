import { Injectable } from '@nestjs/common';
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

  async findAll(withIngredients = false): Promise<object> {
    let query = {};
    if (withIngredients) {
      query = {
        relations: {
          productIngredients: {
            ingredient: true,
          },
        },
        order: {
          id: 'ASC',
        },
        where: {
          isActive: true,
        },
      };
    }
    const data = await this.repo.find(query);
    return response(200, 'OK', data);
  }
}
