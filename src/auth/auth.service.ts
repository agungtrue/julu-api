import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh_tokens.entity';
import { User } from '../users/users.entity';
import { Customer } from '../customers/customers.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Customer)
    private customerRepo: Repository<Customer>,
  ) {}

  async generateTokens(payload: any) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '120m',
    });

    const refreshTokenStr = randomUUID();
    const refreshToken = this.refreshTokenRepo.create({
      refresh_token: refreshTokenStr,
      user_type: payload.type,
      user: payload.userId ? ({ id: payload.userId } as User) : null,
      customer: payload.customerId
        ? ({ id: payload.customerId } as Customer)
        : null,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    await this.refreshTokenRepo.save(refreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshTokenStr,
    };
  }

  async refresh(refreshTokenStr: string) {
    const token = await this.refreshTokenRepo.findOne({
      where: { refresh_token: refreshTokenStr, is_revoked: false },
      relations: ['user', 'customer'],
    });

    if (!token || token.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = token.user
      ? { userId: token.user.id }
      : { customerId: token.customer.id };

    return this.generateTokens(payload);
  }

  async revokeRefreshToken(refreshTokenStr: string) {
    await this.refreshTokenRepo.update(
      { refresh_token: refreshTokenStr },
      { is_revoked: true },
    );
  }

  async login(
    dto: CreateCustomerDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let access = null;
    if (dto.type === 'customer') {
      access = await this.customerRepo.findOne({ where: { phone: dto.phone } });
    } else {
      access = await this.userRepo.findOne({
        where: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      });
    }

    if (!access) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, access.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log({ access });

    // generate token
    const payload = {
      type: dto.type,
      ...(dto.type === 'customer'
        ? { customerId: access.id }
        : {
            userId: access.id,
            outletId: access.outletId,
            tenantId: access.tenantId,
            userRole: access.role,
            name: access.name,
          }),
    };

    const { access_token, refresh_token } = await this.generateTokens(payload);

    // (opsional) simpan refresh token ke DB kalau mau rotate
    // await this.refreshTokenRepo.save({
    //   customerId: customer.id,
    //   token: refreshToken,
    //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 hari
    // });

    return { accessToken: access_token, refreshToken: refresh_token };
  }
}
