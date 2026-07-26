import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { response } from '../utils/response';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

  create(data: Partial<CreateUserDto>, user: any) {
    const { password, ...entityData } = data;
    const newUser = this.repo.create({
      ...entityData,
      password_hash: password,
      // ...(user?.tenantId && { tenantId: user.tenantId }),
    });
    return this.repo.save(newUser);
  }

  async findAll(search: string, user: any): Promise<object> {
    const tenantId = user.tenantId;

    if (user?.userRole === 'EMPLOYEE') {
      return [];
    }

    // atm search on FE
    if (search) {
      const result = await this.repo.find({
        where: [
          { name: Like(`%${search}%`) },
          { email: Like(`%${search}%`) },
          { phone: Like(`%${search}%`) },
        ],
      });
      return response(200, 'OK', result);
    }

    const query = this.repo
      .createQueryBuilder('users')
      // .leftJoinAndSelect('users.outlet', 'outlet')
      .leftJoinAndSelect('users.tenant', 'tenant')
      .select([
        'users.id',
        'users.email',
        'users.name',
        'users.phone',
        'users.role',
        'users.last_login',
        'users.isActive',
        // 'outlet.name',
        // 'outlet.branch',
        // 'outlet.id',
        'users.created_at',
        'users.tenantId',

        // 'tenant.id',
        'tenant.name',
        'tenant.subdomain',
      ]);
    // .where('users.tenantId = :tenantId', { tenantId });

    if (user?.userRole === 'OWNER_ADMIN') {
      query.where('users.tenantId = :tenantId', { tenantId });
    }

    return response(200, 'OK', await query.getMany());
  }

  async findMe(payload: any): Promise<object> {
    const query = this.repo
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.outlet', 'outlet')
      .leftJoinAndSelect('users.tenant', 'tenant')
      .select([
        'users.id',
        'users.email',
        'users.name',
        'users.phone',
        'users.role',
        'users.last_login',
        'users.mustChangePassword',
        'outlet.name',
        'outlet.branch',
        'outlet.id',
        'users.created_at',
        'tenant.id',
        'tenant.name',
        'tenant.subdomain',
      ])
      .where({ id: payload.id });

    return response(200, 'OK', await query.getMany());
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.repo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // A. Cek password lama
    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.password_hash,
    );
    if (!isMatch) {
      throw new BadRequestException('Password saat ini salah.');
    }

    // B. Pastikan password baru tidak sama dengan password lama
    const isSameAsOld = await bcrypt.compare(
      dto.newPassword,
      user.password_hash,
    );
    if (isSameAsOld) {
      throw new BadRequestException(
        'Password baru tidak boleh sama dengan password lama.',
      );
    }

    // C. Hash password baru
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // D. Update password & set flag mustChangePassword ke false
    user.password_hash = hashedPassword;
    user.mustChangePassword = false;

    await this.repo.save(user);

    return response(
      200,
      'Password Anda berhasil diubah, silahkan logout dan login ulang!',
      [],
    );
  }
}
