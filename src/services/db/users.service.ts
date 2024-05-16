import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DateTime } from 'luxon';
import type { User } from '@internal/prisma/smartg4';
import type { SmartG4DbClient } from './prisma.service';
import { createString } from 'src/utils/string';
import * as crypto from 'crypto';

@Injectable()
export class UserService {
  constructor(
    @Inject('DB_CONNECTION')
    private readonly prisma: SmartG4DbClient,
  ) {
    // check if there a default admin, if none then create it
    this.prisma.user
      .findFirst({
        where: { Username: 'admin' },
      })
      .then((admin) => {
        if (!admin) {
          const hasher = crypto.createHash('sha256');
          hasher.update('admin');

          this.createUser({
            username: 'admin',
            password: hasher.digest('hex'),
            firstName: 'Admin',
            lastName: 'Admin',
            email: 'g4admin@building.net',
            isAdmin: true,
          });
        }
      });
  }

  async list(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: {
        Id: 'asc',
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { Username: username.toLowerCase() },
    });
  }

  async findById(id: any): Promise<User | null> {
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
    isAdmin = false,
  }: {
    username: string;
    password: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    isAdmin?: boolean;
  }) {
    const hasher = crypto.createHash('sha256');
    hasher.update(password);

    await this.prisma.user.create({
      data: {
        Username: username.toLowerCase(),
        Password: hasher.digest('hex'),
        Role: isAdmin ? 'admin' : 'user',
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
        Role: true,
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
    const hasher = crypto.createHash('md5');
    hasher.update(password);

    await this.prisma.user.update({
      where: { Id: id },
      data: { Password: hasher.digest('hex') },
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
