import { Controller, Get, Post, Body } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto'

@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionService: PromotionsService) {}

  @Get('/')
  list(): object {
    return this.promotionService.findAll();
  }

  @Post('/')
  async create(
    @Body() body: CreatePromotionDto,
  ): Promise<object> {
    return await this.promotionService.create(body);
  }
}
