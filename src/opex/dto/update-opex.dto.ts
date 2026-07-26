import { PartialType } from '@nestjs/mapped-types';
import { CreateOpexDto } from './create-opex.dto';

export class UpdateOpexDto extends PartialType(CreateOpexDto) {}
