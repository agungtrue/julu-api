import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Reflector } from '@nestjs/core';

// 💡 Custom Decorator Key
import { SUBSCRIPTION_FEATURE_KEY } from 'src/common/decorators/require-subscription.decorator';

// 💡 Services & Entities (sesuaikan relative path jika tidak memakai path alias)
import { SubscriptionsService } from '../services/subscriptions.service';
import { SubscriptionStatus } from '../entities/subscription.entity';
import { Tenant } from 'src/tenants/tenants.entity';

import { extractSubdomain } from '../../utils/subdomain.util';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private readonly subService: SubscriptionsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;
    const user = request.user;

    // Ekstraksi Subdomain dari Request Header Host
    const requestSubdomain = extractSubdomain(request);

    if (
      requestSubdomain === 'admin' &&
      !tenantId &&
      user?.userRole === 'SUPER_ADMIN'
    )
      return true;

    // if (requestSubdomain === 'admin' && user.userRole === 'SUPER_ADMIN') {
    //   return true;
    // }

    // start validate tenant
    if (!user?.tenantId) {
      throw new ForbiddenException(
        'User ini tidak terikat dengan tenant manapun.',
      );
    }

    // Cek Status Langganan dan auto expired
    const sub = await this.subService.getTenantSubscription(tenantId);
    // later update status as enum
    if (sub?.tenant?.status === 'SUSPENDED') {
      throw new ForbiddenException('Akses toko Anda dibekukan oleh Admin.');
    }


    if (!requestSubdomain || sub.tenant.subdomain !== requestSubdomain) {
      throw new ForbiddenException({
        code: 'TENANT_DOMAIN_MISMATCH',
        message: 'Domain toko tidak sesuai dengan akun terdaftar Anda.',
        data: {
          currentSubdomain: requestSubdomain || 'unknown',
          targetSubdomain: sub.tenant.subdomain,
          targetUrl: `https://${sub.tenant.subdomain}.julucoffee.com`,
        },
      });
    }

    const isValid =
      sub.status === SubscriptionStatus.ACTIVE ||
      sub.status === SubscriptionStatus.TRIALING;

    console.log({ requestSubdomain, subdomain: sub.tenant.subdomain, isValid });

    if (!isValid || sub.endDate < new Date()) {
      throw new ForbiddenException(
        'Masa langganan Julu POS Anda telah berakhir.',
      );
    }

    // 2. Cek Fitur Spesifik (Jika ada featureKey di decorator)
    const requiredFeature = this.reflector.getAllAndOverride<string>(
      SUBSCRIPTION_FEATURE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredFeature && sub?.plan?.features) {
      const hasAccess = sub.plan.features[requiredFeature];
      if (!hasAccess) {
        throw new ForbiddenException(
          `Paket langganan Anda (${sub.plan.name}) tidak memiliki akses ke fitur ini.`,
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.tenant = sub;

    return true;
  }
}
