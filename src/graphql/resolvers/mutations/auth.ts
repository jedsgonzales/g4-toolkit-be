import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from '@services';
import { AuthResult } from 'src/graphql/models';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  /**
   * Sign-In guidelines:
   *  1. Obtain a login key using GetLoginKey mutation
   *  2. Use the key to obfuscate the password:
   *    2.1 hash the password with sha256 algo and obtain hex string value
   *    2.2 concatenate the password hash with loginkey and has the result with md5 algo
   *  3. Submit the username and the resulting md5 hex string value to the SignIn mutation
   * @param username unique value username
   * @param password obfucated password value
   * @returns 
   */
  @Mutation(() => AuthResult)
  SignIn(@Args('Username') username: string, @Args('Key') password: string) {
    return this.authService.signIn(username, password);
  }

  @Mutation(() => String)
  GetLoginKey(@Args('Username') userName: string) {
    return this.authService.getLoginKey(userName);
  }
}
