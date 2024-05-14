import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { BigIntResolver } from 'graphql-scalars';
import { AreaService, ChannelNodeService, DeviceService, NetworkBroacasterService, SystemFilterService, UserService, prismaService } from './services/db';
import { AuthService } from './services';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './constants/jwt';
import { AuthResolver, FilterMutations, FiltersQueries, ReceiverAnnouncements } from './graphql/resolvers';
import { User } from './graphql/models';
import { DeviceQueries } from './graphql/resolvers/queries/device.queries';
import { PubSub } from 'graphql-subscriptions';

interface RequestWithUser extends Request {
  user?: User;
}
export interface GraphQLContext {
  req: RequestWithUser;
}

const isProd =
  process.env['NODE_ENV'] !== 'development' &&
  process.env['NODE_ENV'] !== 'test';

export const pubSub = new PubSub();
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: !isProd,
      autoSchemaFile: true,
      resolvers: { BigInt: BigIntResolver },
      context: ({ request }) => ({
        req: request,
      }),
      subscriptions: {
        'graphql-ws': true,
      },
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

    AreaService,
    ChannelNodeService,
    DeviceService,
    NetworkBroacasterService,
    SystemFilterService,
    UserService,
    { provide: 'DB_CONNECTION', useValue: prismaService },

    AuthResolver,
    DeviceQueries,
    FiltersQueries,
    ReceiverAnnouncements,

    AuthService,
    FilterMutations,
  ],
})
export class AppModule {}
