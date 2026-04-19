export const AUTH_HEADER_NAME = 'authorization';
export const BEARER_PREFIX = 'Bearer ';

export const PUBLIC_AUTH_PATHS = {
  signup: '/auth/signup',
  login: '/auth/login',
  refresh: '/auth/refresh',
} as const;

export const PUBLIC_BASE_PATHS = {
  root: '/',
  docs: '/doc',
} as const;
