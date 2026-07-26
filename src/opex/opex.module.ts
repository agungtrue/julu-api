import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OpexService } from './opex.service';
import { OpexController } from './opex.controller';
import { Opex } from './opex.entity';
import { Tenant } from '../tenants/tenants.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Opex, Tenant])],
  providers: [OpexService],
  controllers: [OpexController],
})
export class OpexModule {}
