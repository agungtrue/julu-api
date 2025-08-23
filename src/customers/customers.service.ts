import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm'
import { Customer } from './customers.entity'
import { response } from '../utils/response'

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>
  ) {}

  create(data: Partial<Customer>) {
    const customer = this.repo.create(data);
    return this.repo.save(customer);
  }

  async findAll(search?: string): Promise<object> {
    if (search) {
      const result = await this.repo.find({
        where: [
          { first_name: Like(`%${search}%`) },
          { last_name: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { phone: Like(`%${search}%`) },
        ]
      })
      return response(200, 'OK', result)
    }
    
    return response(200, 'OK', await this.repo.find())
  }
}
