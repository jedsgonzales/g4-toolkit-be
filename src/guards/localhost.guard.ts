import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class LocalhostGuard implements CanActivate {
  constructor() {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = this.getRequest(context);

    try {
      if (request.ip !== '127.0.0.1' || request.ip !== '::ffff:127.0.0.1') {
        throw new UnauthorizedException();
      }
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }
}
