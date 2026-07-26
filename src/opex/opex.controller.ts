import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OpexService } from './opex.service';
import { CreateOpexDto } from './dto/create-opex.dto';
import { UpdateOpexDto } from './dto/update-opex.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('opex')
@RequireSubscription()
export class OpexController {
  constructor(private readonly opexService: OpexService) {}

  /**
   * 1. CREATE OPEX (Fixed Harian / One-Time Dadakan)
   * POST /opex
   */
  @Post()
  async create(@Body() createOpexDto: CreateOpexDto, @CurrentUser() user: any) {
    return await this.opexService.createOpex(createOpexDto, user);
  }

  /**
   * 2. GET OPEX SUMMARY & RANGE GRAPH (Bulanan / Custom Range)
   * GET /opex/summary?startDate=2026-07-01&endDate=2026-07-19
   * pending, waiting fedback
   */
  @Get('summary')
  async getSummary(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
    @CurrentUser() user: any,
  ) {
    // Parsing string query parameter menjadi native Date object
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    return await this.opexService.getOpexSummaryByRange(
      user,
      startDate,
      endDate,
    );
  }

  /**
   * GET /opex
   */
  @Get()
  async findAll(@CurrentUser() user: any) {
    return await this.opexService.findAll(user);
  }

  /**
   * GET /opex/:id
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return await this.opexService.findOne(id, user);
  }

  /**
   * 5. UPDATE OPEX (Bisa ganti nominal atau matikan status FIXED lewat isActive)
   * PATCH /opex/:id
   */
  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOpexDto: UpdateOpexDto,
    @CurrentUser() user: any,
  ) {
    return await this.opexService.update(id, updateOpexDto, user);
  }

  /**
   * DELETE /opex/:id
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    return await this.opexService.remove(id, user);
  }
}
