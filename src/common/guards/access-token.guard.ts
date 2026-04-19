import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../../auth/auth.service';
import {
  AUTH_HEADER_NAME,
  BEARER_PREFIX,
  PUBLIC_AUTH_PATHS,
  PUBLIC_BASE_PATHS,
} from '../constants/auth.constant';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (request.method === 'OPTIONS' || isPublicPath(resolvePath(request))) {
      return true;
    }

    const token = readBearerToken(request);
    const payload = this.verifyAccessToken(token);
    attachUserPayload(request, payload);
    return true;
  }

  private verifyAccessToken(token: string): jwt.JwtPayload {
    try {
      const decodedToken = jwt.verify(token, this.authService.getAccessSecret());
      if (typeof decodedToken === 'string') {
        throw new UnauthorizedException('Invalid token payload');
      }
      return decodedToken;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}

function resolvePath(request: Request): string {
  const rawPath = request.path || request.url?.split('?')[0] || '';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
}

function isPublicPath(path: string): boolean {
  if (
    path === PUBLIC_AUTH_PATHS.signup ||
    path === PUBLIC_AUTH_PATHS.login ||
    path === PUBLIC_AUTH_PATHS.refresh ||
    path === PUBLIC_BASE_PATHS.root ||
    path === PUBLIC_BASE_PATHS.docs
  ) {
    return true;
  }
  return path.startsWith(`${PUBLIC_BASE_PATHS.docs}/`);
}

function readBearerToken(request: Request): string {
  const authorizationHeader = request.headers[AUTH_HEADER_NAME];
  if (!authorizationHeader || Array.isArray(authorizationHeader)) {
    throw new UnauthorizedException('Unauthorized');
  }
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedException('Unauthorized');
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  if (token.length === 0) {
    throw new UnauthorizedException('Unauthorized');
  }
  return token;
}

function attachUserPayload(request: Request, payload: jwt.JwtPayload): void {
  const mutableRequest = request as Request & { user?: jwt.JwtPayload };
  mutableRequest.user = payload;
}
