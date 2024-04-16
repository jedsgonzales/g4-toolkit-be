import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class HelloResolver {
  @Query(() => String)
  SayHello() {
    return 'Hello World!';
  }
}
