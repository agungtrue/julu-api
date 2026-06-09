import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'
import { Customer } from './customers.entity'
import { CreateCustomerDto } from './dto/create-customer.dto'
import { response } from '../utils/response'

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private repo: Repository<Customer>
  ) {}

  async create(data: Partial<CreateCustomerDto>) {
    const isExist = await this.repo.findOne({
      where: [
        { email: data.email },
        { phone: data.phone },
      ],
    })

    if (isExist) {
      throw new BadRequestException('email or phone number aleady exist!');
    }

    const customer = this.repo.create({
      ...data,
      password_hash: data.password,
    });
    return this.repo.save(customer);
  }

  async findAll(search?: string): Promise<object> {
    const query = this.repo.createQueryBuilder('customers')
    .select([
      'customers.id',
      'customers.first_name',
      'customers.last_name',
      'customers.email',
      'customers.phone',
      'customers.created_at',
      'customers.updated_at',
    ]);

    if (search) {
      query.where(
        'customers.first_name ILIKE :search OR customers.last_name ILIKE :search OR customers.phone::text ILIKE :search OR customers.email::text ILIKE :search',
        { search: `%${search}%` },
      );
    }
    
    return response(200, 'OK', await query.getMany())
  }
}
