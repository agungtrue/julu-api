import {
  Controller,
  Query,
  Get,
  Body,
  Post,
  HttpException,
  HttpStatus,
  Request,
  Res,
  Delete,
  HttpCode,
  Param,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { response } from '../utils/response';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('orders')
@RequireSubscription()
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get('/')
  async list(
    @Query('search') search: string,
    // @Query('status') status: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ): Promise<object> {
    console.log({ startDate, endDate });
    const orders = await this.orderService.findAll(search, user, null, null);

    if (startDate && endDate) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return orders;
    }

    return response(200, 'OK', orders);
  }

  @Get('/summary')
  async summary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('all') all: string,
    @CurrentUser() user: any,
  ): Promise<object> {
    const result = await this.orderService.getSummary(startDate, endDate, all, user);
    return response(200, 'OK', [result]);
  }

  @Post('/init')
  async init(
    @Body() body: any,
    @Request() req: any,
    @CurrentUser() user: any,
  ): Promise<object> {
    if (user?.userRole === 'SUPER_ADMIN') {
      throw new HttpException(
        'You cannot perform this action',
        HttpStatus.BAD_REQUEST,
      );
    }

    const uuid = uuidv4();
    body.uuid = uuid;
    body.userId = user?.id || null;
    body.outletId = user?.outletId || null;
    body.tenantId = user?.tenantId || null;
    await this.orderService.create(body, user);

    return { orderUuid: uuid };
  }

  @Post('/confirm')
  async confirm(@Body() body: any, @CurrentUser() user: any): Promise<object> {
    if (user?.userRole === 'SUPER_ADMIN') {
      throw new HttpException(
        'You cannot perform this action',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid = await this.orderService.validate(body.uuid);
    if (isValid) {
      return await this.orderService.confirm(body, user);
    }

    throw new HttpException('Order not found!', HttpStatus.NOT_FOUND);
  }

  @Post('/apply-promo')
  async applyPromo(@Body() body: any, @Request() req: any): Promise<object> {
    const data = await this.orderService.applyPromo(body);

    return data;
  }
  @Get('/sales-report')
  async exportSales(
    @CurrentUser() user: any,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const tenantId = user.subscription.tenantId;
    const tenantName = user.subscription.tenant.name;

    console.log({ tenantId, tenantName, startDate, endDate });

    const [orders, summaryData] = await Promise.all([
      this.orderService.findAll(null, user, startDate, endDate),
      this.orderService.getSummary(startDate, endDate, null, user),
    ]);

    const dateRangeLabel = `${startDate || 'Awal'} s/d ${endDate || 'Hari Ini'}`;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.orderService.generateSalesExcel(
      tenantName,
      dateRangeLabel,
      orders,
      summaryData,
      res,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteOrder(@Param('id') id: string, @CurrentUser() user: any) {
    const tenantId = user?.tenantId;
    return await this.orderService.deleteOrder(id, tenantId);
  }
}
