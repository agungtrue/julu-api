import { Module } from '@nestjs/common';
import { OutletsService } from './outlets.service';
import { OutletsController } from './outlets.controller';

@Module({
  providers: [OutletsService],
  controllers: [OutletsController]
})
export class OutletsModule {}
