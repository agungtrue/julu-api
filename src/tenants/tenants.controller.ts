import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  SetMetadata,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { ToggleStoreStatusDto } from './dto/toggle-store-status.dto';

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

  @Get('settings')
  async getSettings(@CurrentUser() user: any) {
    const tenantId = user.tenantId; // Diambil dari JWT Token
    return this.tenantsService.getSettings(tenantId);
  }

  // Update Pengaturan Tenant Login
  @Patch('settings')
  async updateSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateTenantSettingsDto,
  ) {
    const tenantId = user.tenantId; // Diambil dari JWT Token
    return this.tenantsService.updateSettings(tenantId, dto);
  }

  @Get('special-days')
  async getTodayStatus(@CurrentUser() user: any) {
    const tenantId = user.tenantId;
    return this.tenantsService.getTodayStatus(tenantId);
  }

  @Patch('special-days')
  async toggleTodayStatus(
    @CurrentUser() user: any,
    @Body() dto: ToggleStoreStatusDto,
  ) {
    const tenantId = user.tenantId;
    const userId = user?.id || null;
    return this.tenantsService.toggleTodayStatus(tenantId, userId, dto);
  }

  @Put(':id')
  async updateTenant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantsService.update(id, dto);
  }

  /**
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
