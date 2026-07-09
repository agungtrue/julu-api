import {
  Controller,
  Query,
  Get,
  Body,
  Post,
  HttpException,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { v4 as uuidv4 } from 'uuid';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get('/')
  list(
    @Query('search') search: string,
    @Query('status') status: string,
    @CurrentUser() user: any,
  ): object {
    return this.orderService.findAll(search, user, status);
  }

  @Get('/summary')
  summary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('all') all: string,
    @CurrentUser() user: any,
  ): object {
    return this.orderService.getSummary(startDate, endDate, all, user);
  }

  @Post('/init')
  async init(
    @Body() body: CreateOrderDto,
    @Request() req: any,
    @CurrentUser() user: any,
  ): Promise<object> {
    const uuid = uuidv4();
    body.uuid = uuid;
    body.userId = user?.id || null;
    body.outletId = user?.outletId || null;
    await this.orderService.create(body);

    return { orderUuid: uuid };
  }

  @Post('/confirm')
  async confirm(@Body() body: CreateOrderDto): Promise<object> {
    const isValid = await this.orderService.validate(body.uuid);
    if (isValid) {
      return await this.orderService.confirm(body);
    }

    throw new HttpException('Order not found!', HttpStatus.NOT_FOUND);
  }

  @Post('/apply-promo')
  async applyPromo(@Body() body: any, @Request() req: any): Promise<object> {
    const data = await this.orderService.applyPromo(body);

    return data;
  }
}
