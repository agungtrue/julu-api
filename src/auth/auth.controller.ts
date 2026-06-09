import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto'
import { Public } from '../common/decorators/public.decorator'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() body: CreateCustomerDto) {
    // validate user first
    return this.authService.login(body);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refresh(body.refresh_token);
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token: string }) {
    await this.authService.revokeRefreshToken(body.refresh_token);
    return { success: true };
  }
}