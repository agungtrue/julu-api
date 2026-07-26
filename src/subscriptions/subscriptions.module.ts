import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { Subscription } from './entities/subscription.entity';
import { SubscriptionInvoice } from './entities/subscription-invoice.entity';
import { Tenant } from 'src/tenants/tenants.entity';

import { SubscriptionPlansController } from './controllers/subscription-plans.controller';
import { SubscriptionsController } from './controllers/subscriptions.controller';
import { SubscriptionInvoicesController } from './controllers/subscription-invoices.controller';

import { SubscriptionPlansService } from './services/subscription-plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { SubscriptionInvoicesService } from './services/subscription-invoices.service';

import { SubscriptionGuard } from './guards/subscription.guard';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      Subscription,
      SubscriptionInvoice,
      Tenant,
    ]),
  ],
  controllers: [
    SubscriptionPlansController,
    SubscriptionsController,
    SubscriptionInvoicesController,
  ],
  providers: [
    SubscriptionPlansService,
    SubscriptionsService,
    SubscriptionInvoicesService,
    SubscriptionGuard,
  ],
  exports: [SubscriptionsService, SubscriptionGuard],
})
export class SubscriptionsModule {}
