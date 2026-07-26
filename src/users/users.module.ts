import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './users.entity';
import { Tenant } from 'src/tenants/tenants.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Tenant])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
