import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';
/* import { BigIntResolver } from 'graphql-scalars'; */
import { UsersService, prismaService } from './services/db';
import { AuthService } from './services';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt';
import { AuthResolver, HelloResolver } from './graphql/resolvers';

const isProd =
  process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: !isProd,
      autoSchemaFile: true,
      /* resolvers: { BigInt: BigIntResolver }, */
      context: ({ request }) => ({
        req: request,
      }),
    }),
    JwtModule.register({
      global: true,
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UsersService,
    AuthService,
    { provide: 'DB_CONNECTION', useValue: prismaService },

    HelloResolver,
    AuthResolver,
  ],
})
export class AppModule {}
