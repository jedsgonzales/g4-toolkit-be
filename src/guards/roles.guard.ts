import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Roles } from "src/decorators/roles.decorator";


@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get(Roles, context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    let isPermitted = false;

    if(user){
        isPermitted = user.Roles.filter((role) => roles.includes(role.RoleName)).length > 0;
    }
  
    return isPermitted;
  }
}
