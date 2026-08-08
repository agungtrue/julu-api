import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { IngredientMutationService } from './ingredient-mutations.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RestockIngredientDto } from './dto/restock-ingredient.dto';
import { RecordLossDto } from './dto/record-loss.dto';
import { StockOpnameDto } from './dto/stock-opname.dto';
import { StockMutationType } from './stock-mutation-type.enum';
import { response } from '../utils/response';

// Asumsi Guard Auth Julu POS kamu
// @UseGuards(JwtAuthGuard)
@Controller('ingredients/mutations')
export class IngredientMutationController {
  constructor(private readonly mutationService: IngredientMutationService) {}

  @Post('restock')
  async restock(@CurrentUser() user: any, @Body() dto: RestockIngredientDto) {
    const tenantId = user.tenantId;
    const userId = user.id;
    return await this.mutationService.restock(tenantId, userId, dto);
  }

  @Post('loss')
  async recordLoss(@CurrentUser() user: any, @Body() dto: RecordLossDto) {
    const tenantId = user.tenantId;
    const userId = user.id;
    return await this.mutationService.recordLoss(tenantId, userId, dto);
  }

  @Post('opname')
  async adjustStockOpname(
    @CurrentUser() user: any,
    @Body() dto: StockOpnameDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user.id;
    return await this.mutationService.adjustStockOpname(tenantId, userId, dto);
  }

  @Get('summary')
  async getSummaryStats(@CurrentUser() user: any) {
    const tenantId = user.tenantId;
    const data = await this.mutationService.getSummaryStats(tenantId);
    return response(200, 'OK', [data]);
  }

  @Get()
  async getLogs(
    @CurrentUser() user: any,
    @Query('ingredientId') ingredientId?: string,
    @Query('type') type?: StockMutationType,
  ) {
    const tenantId = user.tenantId;
    const data = await this.mutationService.getLogs(
      tenantId,
      ingredientId,
      type,
    );
    return response(200, 'OK', data);
  }
}
