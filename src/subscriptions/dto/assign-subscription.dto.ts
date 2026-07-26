import { PartialType } from '@nestjs/mapped-types';
import { RenewSubscriptionDto } from './renew-subscription.dto';

export class AssignSubscriptionDto extends PartialType(RenewSubscriptionDto) {}
