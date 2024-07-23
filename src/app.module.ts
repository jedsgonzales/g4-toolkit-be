import type { ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { jwtConstants } from './constants/jwt';
import { DeviceQueries } from './graphql/resolvers/queries/device.queries';
import { AuthMutations } from './graphql/resolvers/mutations/auth.mutations';
import { FilterMutations } from './graphql/resolvers/mutations/filter.mutations';
import { FilterQueries } from './graphql/resolvers/queries/filter.queries';
import { ReceiverAnnouncements } from './graphql/resolvers/queries/receiver.announcements';
import { AuthService } from './services/auth.service';
import { AreaService } from './services/db/area.service';
import { ChannelNodeService } from './services/db/channel.node.service';
import { DeviceService } from './services/db/device.service';
import { NetworkBroacasterService } from './services/db/network.broadcaster.service';
import { SystemFilterService } from './services/db/system.filter.service';
import { UserService } from './services/db/users.service';
import { prismaService } from './services/db/prisma.service';
import { UserRoleService } from './services/db/user.role.service';
import { AuthQueries } from './graphql/resolvers/queries/auth.queries';
import { UserQueries } from './graphql/resolvers/queries/user.queries';
import { LocationQueries } from './graphql/resolvers/queries/location.queries';
import { LocationMutations } from './graphql/resolvers/mutations/location.mutations';
import { NetworkDeviceMutations } from './graphql/resolvers/mutations/network.device.mutations';

const isProd =
  process.env['NODE_ENV'] !== 'development' &&
  process.env['NODE_ENV'] !== 'test';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: !isProd,
      autoSchemaFile: true,
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
    UserRoleService,

    AuthMutations,
    AuthQueries,
    DeviceQueries,
    FilterQueries,
    LocationQueries,
    ReceiverAnnouncements,
    UserQueries,

    FilterMutations,
    LocationMutations,
    NetworkDeviceMutations,
  ],
})
export class AppModule {}
