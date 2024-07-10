import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from '../admin/admin.module';
import { AdminController } from '../admin/admin.controller';
import { AdminService } from '../admin/admin.service';
import { DB_CONFIGS, DatabaseModule } from '../database/database.module';
import { UserModule } from '../user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { config } from 'dotenv';

config();

import { ArtifactModule } from '../artifact/artifact.module';
import { PairModule } from '../pair/pair.module';
import { PairController } from '../pair/pair.controller';
import { PairService } from '../pair/pair.service';
import { ArtifactService } from '../artifact/artifact.service';
import {
  FailedCrafts,
  FailedCraftsSchema,
  LockedBurn,
  LockedBurnSchema,
  LockedMint,
  LockedMintSchema,
  OpenedArtifact,
  OpenedArtifactSchema,
  User,
  UserSchema,
} from '../user/user.schema';
import { Pair, PairSchema } from '../pair/pair.schema';
import { Artifact, ArtifactSchema } from '../artifact/artifact.schema';
import { AuthModule } from '../auth/auth.module';
import { UserController } from '../user/user.controller';
import { ArtifactController } from '../artifact/artifact.controller';
import { ReferralsController } from '../referrals/referrals-controller/referrals.controller';
import { ReferralsService } from '../referrals/referrals-service/referrals.service';
import { RefCode, RefCodeSchema } from '../referrals/refCodes.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { UserService } from 'src/user/user.service';
import { BullModule } from '@nestjs/bull';
import { BotService } from 'src/bot/bot.service';
import { Web3Service } from 'src/web3/web3.service';
import { NftController } from 'src/web3/nft.controller';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { LockedMintsService } from 'src/tasks/locked-mints.service';
import { LockedBurnsService } from 'src/tasks/locked-burns.service';
import { BonusesProcessor } from 'src/tasks/processors/bonuses.processor';
import { StatisticService } from 'src/statistic/statistic.service';
import { StatisticController } from 'src/statistic/statistic.controller';
import { MintsProcessor } from 'src/tasks/processors/mints.processor';
import { BurnsProcessor } from 'src/tasks/processors/burns.processor';
import { GiftsCronService } from 'src/tasks/crons/gifts-cron.service';
import { GiftsFilledProcessor } from 'src/tasks/processors/gifts-filled.processor';
import { StackedNftsCronService } from 'src/tasks/crons/stacked-nfts-cron.service';
import { Web3Module } from 'src/web3/web3.module';
import { QUEUE_NAMES } from 'src/queue';
import { StackedMintsProcessor } from 'src/tasks/processors/stacked-mints.processor';
import { StackedBurnsProcessor } from 'src/tasks/processors/stacked-burns.processor';
import { UserCreationProcessor } from 'src/tasks/processors/user-creation.processor';
import {
  BatchRewards,
  BatchRewardsSchema,
} from 'src/user/batch-rewards.schema';
import {
  ClaimableArtifact,
  ClaimableArtifactSchema,
} from 'src/user/claimable-artifact.schema';
import { TransactionService } from 'src/database/transaction.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { HttpCacheInterceptor } from 'src/auth/http-cache.interceptor';
import { UserNotificationsService } from 'src/user/user-notifications.service';
import {
  UserNotifications,
  UserNotificationsSchema,
} from 'src/user/user-notifications.schema';
import { LastLoginNotificationsCronService } from 'src/tasks/crons/last-login-notifications-cron.service';
import { LastLoginNotificationsProcessor } from 'src/tasks/processors/last-login-notifications.processor';
import { UpgradesModule } from 'src/upgrades/upgrades.module';
import {
  UserBalances,
  UserBalancesSchema,
} from 'src/user/user-balances.schema';
import { UserBalancesService } from 'src/user/user-balances.service';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 1000,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ttl: +configService.get('REDIS_TTL'),
          url: configService.get('REDIS_URL'),
        };
      },
      inject: [ConfigService],
    }),
    AdminModule,
    UserModule,
    UpgradesModule,
    DatabaseModule,
    PairModule,
    ArtifactModule,
    AuthModule,
    Web3Module,

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          ...DB_CONFIGS,
          uri: configService.get('DATABASE_CONNECTION_STRING'),
        };
      },
      inject: [ConfigService],
    }),

    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },

      {
        name: FailedCrafts.name,
        schema: FailedCraftsSchema,
      },
      { name: Pair.name, schema: PairSchema },
      { name: Artifact.name, schema: ArtifactSchema },
      { name: OpenedArtifact.name, schema: OpenedArtifactSchema },
      { name: ClaimableArtifact.name, schema: ClaimableArtifactSchema },
      { name: BatchRewards.name, schema: BatchRewardsSchema },
      { name: RefCode.name, schema: RefCodeSchema },
      {
        name: LockedMint.name,
        schema: LockedMintSchema,
      },
      {
        name: LockedBurn.name,
        schema: LockedBurnSchema,
      },
      {
        name: UserNotifications.name,
        schema: UserNotificationsSchema,
      },
      {
        name: UserBalances.name,
        schema: UserBalancesSchema,
      },
    ]),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          redis: {
            host: configService.get('REDIS_URL').split('//')[1].split(':')[0],
            port: configService.get('REDIS_URL').split('//')[1].split(':')[1],
            password: configService.get('REDIS_PASSWORD'),
          },
          limiter: {
            max: 1,
            duration: 60 * 1000,
            bounceBack: true,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.FOLLOWERS,
      },
      {
        name: QUEUE_NAMES.USER_CREATION,
      },
      {
        name: QUEUE_NAMES.MINTS,
      },
      {
        name: QUEUE_NAMES.BURNS,
      },
      {
        name: QUEUE_NAMES.STACKED_MINTS,
      },
      {
        name: QUEUE_NAMES.STACKED_BURNS,
      },
      {
        name: QUEUE_NAMES.GIFTS_FILLED,
      },
      {
        name: QUEUE_NAMES.LOGIN_NOTIFICATIONS,
      },
    ),
  ],
  controllers: [
    AppController,
    AdminController,
    PairController,
    UserController,
    ArtifactController,
    ReferralsController,
    NftController,
    StatisticController,
  ],
  providers: [
    AppService,
    AdminService,
    PairService,
    UserService,
    UserNotificationsService,
    ArtifactService,
    ReferralsService,
    AppCacheService,
    BotService,
    Web3Service,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    StatisticService,

    LockedMintsService,
    LockedBurnsService,

    MintsProcessor,
    BurnsProcessor,
    StackedMintsProcessor,
    StackedBurnsProcessor,
    LastLoginNotificationsProcessor,
    BonusesProcessor,
    UserCreationProcessor,
    GiftsFilledProcessor,

    GiftsCronService,
    StackedNftsCronService,
    LastLoginNotificationsCronService,

    TransactionService,
    AnalyticsService,

    UserBalancesService,
  ],
})
export class AppModule {}
