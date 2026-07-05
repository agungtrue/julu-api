import { Expose, Transform } from 'class-transformer';

export class CustomerResponseDto {
  @Expose()
  id: number;

  @Expose()
  @Transform(({ obj }) => obj.first_name)
  firstName: string;

  @Expose()
  @Transform(({ obj }) => obj.last_name)
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  isActive: boolean;

  @Expose()
  orders: any[];
}
