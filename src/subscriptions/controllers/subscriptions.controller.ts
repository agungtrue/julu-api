import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service';
import { RenewSubscriptionDto } from '../dto/renew-subscription.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  /**
   * Tenant mengecek status langganannya sendiri
   */
  @Get('me')
  getMySubscription(@CurrentUser() user: any) {
    // Diasumsikan tenantId diambil dari JWT token user (req.user.tenantId)
    const tenantId = user?.tenantId;
    return this.subService.getTenantSubscription(tenantId);
  }

  /**
   * Super Admin Assign/Renew Paket secara Manual
   */
  @Post('renew-manual')
  renewManual(@Body() renewDto: RenewSubscriptionDto) {
    return this.subService.renewSubscription(renewDto);
  }
}
