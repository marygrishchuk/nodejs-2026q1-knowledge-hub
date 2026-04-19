export const AUTH_ENV_KEYS = {
  accessSecretPrimary: 'JWT_SECRET',
  accessSecretFallback: 'JWT_SECRET_KEY',
  refreshSecretPrimary: 'JWT_REFRESH_SECRET',
  refreshSecretFallback: 'JWT_SECRET_REFRESH_KEY',
  accessTtlPrimary: 'JWT_ACCESS_TTL',
  accessTtlFallback: 'TOKEN_EXPIRE_TIME',
  refreshTtlPrimary: 'JWT_REFRESH_TTL',
  refreshTtlFallback: 'TOKEN_REFRESH_EXPIRE_TIME',
} as const;

export const AUTH_DEFAULTS = {
  accessSecret: 'access-secret',
  refreshSecret: 'refresh-secret',
  accessTtl: '15m',
  refreshTtl: '7d',
} as const;

export const AUTH_MESSAGES = {
  unauthorized: 'Unauthorized',
  forbidden: 'Forbidden',
  invalidCredentials: 'Invalid login or password',
  invalidRefreshToken: 'Invalid or expired refresh token',
  missingRefreshToken: 'Refresh token is required',
} as const;
