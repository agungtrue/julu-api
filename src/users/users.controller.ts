import { Body, Controller, Get, Post, Query, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequireSubscription } from '../common/decorators/require-subscription.decorator';

@Controller('users')
// @RequireSubscription()
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('/')
  list(
    // @Query('page') page: string,
    // @Query('limit') limit: string,
    @Query('search') search: string,
    @CurrentUser() user: any,
  ): object {
    return this.userService.findAll(search, user);
  }

  @Get('/my')
  user(@CurrentUser() user: any): object {
    return this.userService.findMe(user);
  }

  @Patch('/change-password')
  changePassword(@CurrentUser() user: any, @Body() dto: ChangePasswordDto) {
    const id = user?.id
    return this.userService.changePassword(id, dto);
  }

  @Post('/')
  async create(
    @Body() body: CreateUserDto,
    @CurrentUser() user: any,
  ): Promise<object> {
    console.log({ body, user });
    return await this.userService.create(body, user);
  }
}
