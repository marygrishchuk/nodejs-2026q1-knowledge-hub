import { Injectable } from '@nestjs/common';
import { AUTH_DEFAULTS, AUTH_ENV_KEYS } from './auth.constants';

@Injectable()
export class AuthService {
  getAccessSecret(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.accessSecretPrimary,
      AUTH_ENV_KEYS.accessSecretFallback,
      AUTH_DEFAULTS.accessSecret,
    );
  }

  getRefreshSecret(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.refreshSecretPrimary,
      AUTH_ENV_KEYS.refreshSecretFallback,
      AUTH_DEFAULTS.refreshSecret,
    );
  }

  getAccessTtl(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.accessTtlPrimary,
      AUTH_ENV_KEYS.accessTtlFallback,
      AUTH_DEFAULTS.accessTtl,
    );
  }

  getRefreshTtl(): string {
    return readEnvWithFallback(
      AUTH_ENV_KEYS.refreshTtlPrimary,
      AUTH_ENV_KEYS.refreshTtlFallback,
      AUTH_DEFAULTS.refreshTtl,
    );
  }
}

function readEnvWithFallback(
  primaryKey: string,
  fallbackKey: string,
  defaultValue: string,
): string {
  const primaryValue = process.env[primaryKey];
  if (primaryValue && primaryValue.trim().length > 0) {
    return primaryValue;
  }

  const fallbackValue = process.env[fallbackKey];
  if (fallbackValue && fallbackValue.trim().length > 0) {
    return fallbackValue;
  }

  return defaultValue;
}
