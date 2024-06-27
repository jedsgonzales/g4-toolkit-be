import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { GqlExecutionContext } from "@nestjs/graphql";
import { Roles } from "src/decorators/roles.decorator";


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
  
  canActivate(context: ExecutionContext): boolean {
    const { user } = this.getRequest(context);
    const roles = this.reflector.get<string[]>(Roles, context.getHandler());

    if (!roles) {
      return true;
    }

    let isPermitted = false;

    if(user){
        isPermitted = user.Roles.filter((role) => roles.includes(role.RoleName)).length > 0;
    }

    return isPermitted;
  }
}
