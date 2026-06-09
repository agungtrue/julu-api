import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm'
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto'
import { response } from '../utils/response'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>
  ) {}

  create(data: Partial<CreateUserDto>) {
    const customer = this.repo.create({
      ...data,
      password_hash: data.password,
    });
    return this.repo.save(customer);
  }

  async findAll(search?: string): Promise<object> {
    if (search) {
      const result = await this.repo.find({
        where: [
          { name: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { phone: Like(`%${search}%`) },
        ]
      })
      return response(200, 'OK', result)
    }
    
    return response(200, 'OK', await this.repo.find())
  }

  async findMe(payload: any): Promise<object> {
    const query = this.repo.createQueryBuilder('users')
    .leftJoinAndSelect('users.outlet', 'outlet')
    .select([
      'users.id',
      'users.email',
      'users.name',
      'users.phone',
      'outlet.name',
      'outlet.branch',
      'outlet.id',
      'users.created_at',
    ])
    .where({ id: payload.id })

    return response(200, 'OK', await query.getMany())
  }
}
