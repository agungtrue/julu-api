import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('tenants')
@RequireSubscription()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  /**
   * ONLY SUPER ADMIN
   * POST /tenants
   */
  @Get('/')
  list(@CurrentUser() user: any): object {
    return this.tenantsService.findAll(user);
  }
  @Post()
  // Di masa depan tinggal aktifkan Guard: @UseGuards(JwtAuthGuard, RolesGuard)
  // Untuk sekarang, logic ini siap menerima validasi bypass role 'SUPER_ADMIN'
  async createTenant(@Body() dto: CreateTenantDto) {
    console.log({ dto });
    return this.tenantsService.create(dto);
  }

  @Put(':id')
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  /**
   * 💳 SYSTEM BILLING / SUPER ADMIN (Perpanjang Lisensi)
   * POST /tenants/:id/billing
   */
  //   @Post(':id/billing')
  //   async extendTenantPackage(
  //     @Param('id', ParseUUIDPipe) id: string,
  //     @Body() dto: ExtendPackageDto,
  //   ) {
  //     return this.tenantsService.extendPackage(id, dto);
  //   }

  /**
   * Cek Masa Aktif Tenant
   * GET /tenants/:id/status
   */
  @Get(':id/status')
  async getTenantStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantsService.getStatus(id);
  }
}
