import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { jwtConstants } from 'src/constants/jwt';
import { UserService } from 'src/services/db/users.service';
import { isProd } from 'src/utils/env';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext) {
    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    if (
      !isProd &&
      process.env['ADMIN_DEV_TOKEN'] &&
      token === process.env['ADMIN_DEV_TOKEN']
    ) {
      request['user'] = await this.userService.findByUsername('admin');
      return request['user'];
    }
    try {
      const payload: {
        sub: any;
        username: string;
        ts: number;
      } = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = await this.userService.loadUserData(payload.sub);
    } catch {
      throw new UnauthorizedException();
    }

    return request['user'];
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
