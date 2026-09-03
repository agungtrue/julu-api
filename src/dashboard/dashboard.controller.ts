import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { DashboardService } from './dashboard.service';
import { GetSummaryDashboardDto } from './dto/get-summary-dashboard.dto';
import { response } from '../utils/response';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('dashboard')
@RequireSubscription()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Get('summary')
  async getSummary(
    @Query() dto: GetSummaryDashboardDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.dashboardService.getSummary(dto, user);
    return response(200, 'OK', [result]);
  }

  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @Get('trends')
  async getTrends(
    @Query() dto: GetSummaryDashboardDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.dashboardService.getTrends(dto, user);
    return response(200, 'OK', [result]);
  }
}
