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
    let decodedToken: string | jwt.JwtPayload;
    try {
      decodedToken = jwt.verify(token, this.authService.getAccessSecret());
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Access token has expired');
      }
      throw new UnauthorizedException('Access token is invalid');
    }

    if (typeof decodedToken === 'string') {
      throw new UnauthorizedException('Invalid access token payload');
    }

    return decodedToken;
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
    throw new UnauthorizedException('Authorization header is required');
  }
  if (!authorizationHeader.startsWith(BEARER_PREFIX)) {
    throw new UnauthorizedException('Authorization header must use Bearer scheme');
  }

  const token = authorizationHeader.slice(BEARER_PREFIX.length).trim();
  if (token.length === 0) {
    throw new UnauthorizedException('Bearer token is missing');
  }
  return token;
}

function attachUserPayload(request: Request, payload: jwt.JwtPayload): void {
  const mutableRequest = request as Request & { user?: jwt.JwtPayload };
  mutableRequest.user = payload;
}
