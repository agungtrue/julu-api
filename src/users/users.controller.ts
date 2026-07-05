import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('/')
  list(
    // @Query('page') page: string,
    // @Query('limit') limit: string,
    @Query('search') search: string,
  ): object {
    return this.userService.findAll(search);
  }

  @Get('/my')
  user(@CurrentUser() user: any): object {
    return this.userService.findMe(user);
  }

  @Post('/')
  async create(@Body() body: CreateUserDto): Promise<object> {
    return await this.userService.create(body);
  }
}
