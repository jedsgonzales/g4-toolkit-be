import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DateTime } from 'luxon';
import { UserService } from './db/users.service';
import { jwtConstants } from 'src/constants/jwt';
import * as crypto from 'crypto';
import { AuthResult } from 'src/graphql/models/transient/auth.result';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
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

    if (!user) {
      throw new UnauthorizedException();
    }

    const hasher = crypto.createHash('md5');
    hasher.update(`${user.Password}${user.LoginKey}`);
    const obsPass = hasher.digest('hex');

    if (obsPass !== pass) {
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
