import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { User } from '@internal/prisma/smartg4';
import type { SmartG4DbClient } from '.';
import { createString } from 'src/utils/string';

@Injectable()
export class UsersService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {}

  async findByUsername(username: string): Promise<User | undefined> {
    return this.prisma.user.findFirst({
      where: { Username: username.toLowerCase() },
    });
  }

  async findById(id: any): Promise<User | undefined> {
    return this.prisma.user.findUnique({
      where: { Id: id },
    });
  }

  async createUser({
    username,
    password,
    firstName,
    lastName,
    email,
  }: {
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  }) {
    await this.prisma.user.create({
      data: {
        Username: username.toLowerCase(),
        Password: password,
        FirstName: firstName,
        LastName: lastName,
        Email: email,
        CreatedOn: DateTime.utc().toJSDate(),
      },
    });
  }

  async loadUserData(
    id: any,
  ): Promise<
    | Omit<
        User,
        | 'LoginKey'
        | 'LoginKeyExpireOn'
        | 'Password'
        | 'Disabled'
        | 'Archived'
        | 'ArchivedOn'
      >
    | undefined
  > {
    return await this.prisma.user.findUnique({
      where: { Id: id },
      select: {
        Id: true,
        Username: true,
        Email: true,
        FirstName: true,
        LastName: true,
        CreatedOn: true,
      },
    });
  }

  async setUserStatus(id: any, status: boolean) {
    await this.prisma.user.update({
      where: { Id: id },
      data: { Disabled: status },
    });
  }

  async changeUserPassword(id: any, password: string) {
    await this.prisma.user.update({
      where: { Id: id },
      data: { Password: password },
    });
  }

  async archiveUser(id: any) {
    await this.prisma.user.update({
      where: { Id: id },
      data: { Archived: true, ArchivedOn: DateTime.utc().toJSDate() },
    });
  }

  async createLoginKey(username: string): Promise<string> {
    const user = await this.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException();
    }

    let loginKey: string = '';
    let expiry: Date;

    if (
      user.LoginKey === null ||
      (user.LoginKeyExpireOn &&
        DateTime.utc().toJSDate() > user.LoginKeyExpireOn)
    ) {
      loginKey = createString();
      expiry = DateTime.utc().plus({ minutes: 1 }).toJSDate();

      await this.prisma.user.update({
        where: { Id: user.Id },
        data: { LoginKey: loginKey, LoginKeyExpireOn: expiry },
      });
    } else {
      loginKey = user.LoginKey;
    }

    return loginKey;
  }
}
