import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { SubscriptionGuard } from 'src/subscriptions/guards/subscription.guard';

export const SUBSCRIPTION_FEATURE_KEY = 'subscription_feature_key';

/**
 * 🔒 Decorator Proteksi Langganan & Fitur
 *
 * @param featureKey (Opsional) Key fitur dari JSON features plan (contoh: 'canUseHppModule')
 *
 * @example
 * // Cek status langganan saja:
 * @RequireSubscription()
 *
 * // Cek status langganan + hak akses fitur HPP:
 * @RequireSubscription('canUseHppModule')
 */
export function RequireSubscription(featureKey?: string) {
  return applyDecorators(
    SetMetadata(SUBSCRIPTION_FEATURE_KEY, featureKey),
    UseGuards(SubscriptionGuard),
  );
}
