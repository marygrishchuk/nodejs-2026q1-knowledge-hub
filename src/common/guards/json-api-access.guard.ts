import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import {
  JSON_ACCEPT_HEADER_PATTERN,
  JSON_API_ACCESS_DENIED_MESSAGE,
  SWAGGER_OPENAPI_JSON_PATH,
  SWAGGER_OPENAPI_YAML_PATH,
  SWAGGER_UI_PATH_PREFIX,
} from '../constants/api-access.constant';
import {
  PUBLIC_AUTH_PATHS,
  PUBLIC_BASE_PATHS,
} from '../constants/auth.constant';

@Injectable()
export class JsonApiAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const path = this.resolvePath(request);
    if (this.isDocumentationPath(path)) {
      return true;
    }

    const acceptHeader = request.headers.accept ?? '';
    if (!JSON_ACCEPT_HEADER_PATTERN.test(acceptHeader)) {
      throw new ForbiddenException(JSON_API_ACCESS_DENIED_MESSAGE);
    }
    return true;
  }

  private resolvePath(request: Request): string {
    const raw = request.path || request.url?.split('?')[0] || '';
    return raw.startsWith('/') ? raw : `/${raw}`;
  }

  private isDocumentationPath(path: string): boolean {
    if (
      path === PUBLIC_BASE_PATHS.root ||
      path === PUBLIC_AUTH_PATHS.signup ||
      path === PUBLIC_AUTH_PATHS.login ||
      path === PUBLIC_AUTH_PATHS.refresh
    ) {
      return true;
    }

    return (
      path === SWAGGER_OPENAPI_JSON_PATH ||
      path === SWAGGER_OPENAPI_YAML_PATH ||
      path === SWAGGER_UI_PATH_PREFIX ||
      path.startsWith(`${SWAGGER_UI_PATH_PREFIX}/`)
    );
  }
}
