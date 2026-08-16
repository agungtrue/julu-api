import { IsNotEmpty, IsUUID, IsOptional, IsDateString } from 'class-validator';

export class GetSummaryDashboardDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
