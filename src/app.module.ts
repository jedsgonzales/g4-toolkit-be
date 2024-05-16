import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
/* import { BigIntResolver } from 'graphql-scalars'; */
import { PubSub } from 'graphql-subscriptions';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { jwtConstants } from './constants/jwt';
import { User } from './graphql/models';
import { DeviceQueries } from './graphql/resolvers/queries/device.queries';
import { AuthResolver } from './graphql/resolvers/mutations/auth';
import { FilterMutations } from './graphql/resolvers/mutations/filter.mutations';
import { FiltersQueries } from './graphql/resolvers/queries/filters.queries';
import { ReceiverAnnouncements } from './graphql/resolvers/queries/receiver.announcements';
import { AuthService } from './services/auth.service';
import { AreaService } from './services/db/area.service';
import { ChannelNodeService } from './services/db/channel.node.service';
import { DeviceService } from './services/db/device.service';
import { NetworkBroacasterService } from './services/db/network.broadcaster.service';
import { SystemFilterService } from './services/db/system.filter.service';
import { UserService } from './services/db/users.service';
import { prismaService } from './services/db/prisma.service';

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
      /* resolvers: { BigInt: BigIntResolver }, */
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
    { provide: 'DB_CONNECTION', useValue: prismaService },

    AreaService,
    AuthService,
    ChannelNodeService,
    DeviceService,
    NetworkBroacasterService,
    SystemFilterService,
    UserService,

    AuthResolver,
    DeviceQueries,
    FiltersQueries,
    ReceiverAnnouncements,

    FilterMutations,
  ],
})
export class AppModule {}
