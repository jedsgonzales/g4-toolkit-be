import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DateTime } from 'luxon';
import { UsersService } from './db/users.service';
import { jwtConstants } from 'src/constants/jwt';
import type { AuthResult } from '@graphql';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Sign the user in and return an access token
   * @param username username of user
   * @param pass is an obfuscated value of password based on user's login key value
   * @returns an object containing the access token and user object
   */
  async signIn(username: string, pass: string): Promise<AuthResult> {
    const user = await this.usersService.findByUsername(username);
    if (user?.Password !== pass) {
      throw new UnauthorizedException();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Password, ...result } = user;
    const access_token = await this.jwtService.signAsync(
      {
        sub: user.Id,
        username: user.Username,
        ts: DateTime.utc().toMillis(),
      },
      { secret: jwtConstants.secret },
    );

    return {
      AccessToken: access_token,
      User: result,
    };
  }

  async getLoginKey(username: string): Promise<string> {
    return this.usersService.createLoginKey(username);
  }
}
