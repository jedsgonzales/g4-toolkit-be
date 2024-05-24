import { Inject, Injectable } from '@nestjs/common';
import type { SmartG4DbClient } from './prisma.service';

@Injectable()
export class UserRoleService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {
    this.prisma.userRole
      .findFirst({
        where: { RoleName: 'Admin' },
      })
      .then((adminRole) => {
        if (!adminRole) {
          return this.createUserRole('Admin').then(() =>
            this.createUserRole('Staff'),
          );
        }

        return adminRole;
      });
  }

  async byId(id: number) {
    return this.prisma.userRole.findUnique({
      where: {
        Id: id,
      },
      include: {
        Users: true,
      },
    });
  }

  async byName(name: string) {
    return this.prisma.userRole.findFirst({
      where: {
        RoleName: name,
      },
      include: {
        Users: true,
      },
    });
  }

  async createUserRole(roleName: string) {
    const role = await this.prisma.userRole.create({
      data: {
        RoleName: roleName,
      },
    });

    return role;
  }
}
