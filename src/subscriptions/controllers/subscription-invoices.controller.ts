import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Req,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { SubscriptionInvoicesService } from '../services/subscription-invoices.service';
import { CheckoutInvoiceDto } from '../dto/checkout-invoice.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
// import { RequireSubscription } from '../../common/decorators/require-subscription.decorator';

@Controller('subscription-invoices')
// @RequireSubscription()
export class SubscriptionInvoicesController {
  constructor(private readonly invoicesService: SubscriptionInvoicesService) {}

  /**
   * Tenant melakukan checkout paket dari UI /billing
   */
  @Post('checkout')
  checkout(@CurrentUser() user: any, @Body() dto: CheckoutInvoiceDto) {
    const tenantId = user?.tenantId;
    return this.invoicesService.checkout(tenantId, dto);
  }

  @Get('active-pending')
  getLatestPendingInvoice(@CurrentUser() user: any) {
    const tenantId = user?.tenantId;
    return this.invoicesService.getLatestPendingInvoice(tenantId);
  }

  @Get('admin/dashboard-stats')
  getAdminDashboardStats(@CurrentUser() user: any) {
    const userRole = user?.userRole;
    if (userRole === 'SUPER_ADMIN') {
      return this.invoicesService.getAdminDashboardStats();
    }
    return [];
  }

  @Get('admin/invoice-list')
  // @UseGuards(SuperAdminGuard) // Pasang Guard khusus Super Admin jika ada
  getInvoices(@Query('status') status: string) {
    return this.invoicesService.getInvoicesForAdmin(status);
  }

  /**
   * Tenant melihat riwayat invoice miliknya
   */
  @Get('my-invoices')
  getMyInvoices(@CurrentUser() user: any) {
    const tenantId = user?.tenantId;
    return this.invoicesService.getTenantInvoices(tenantId);
  }

  /**
   * Super Admin / Internal Route untuk konfirmasi pembayaran
   */
  @Patch(':id/approve')
  approveInvoice(@Param('id', ParseUUIDPipe) invoiceId: string) {
    return this.invoicesService.approveInvoice(invoiceId);
  }

  @Get('detail/:invoiceNumber')
  getInvoiceByNumber(
    @CurrentUser() user: any,
    @Param('invoiceNumber') invoiceNumber: string,
  ) {
    const tenantId = user?.tenantId;
    return this.invoicesService.getInvoiceByNumber(tenantId, invoiceNumber);
  }
}
