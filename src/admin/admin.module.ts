import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UserService } from 'src/user/user.service';
import { BotService } from 'src/bot/bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Artifact, ArtifactSchema } from 'src/artifact/artifact.schema';
import { RefCode, RefCodeSchema } from 'src/referrals/refCodes.schema';
import {
  BatchRewards,
  BatchRewardsSchema,
} from 'src/user/batch-rewards.schema';
import {
  ClaimableArtifact,
  ClaimableArtifactSchema,
} from 'src/user/claimable-artifact.schema';
import {
  UserNotifications,
  UserNotificationsSchema,
} from 'src/user/user-notifications.schema';
import {
  User,
  UserSchema,
  FailedCrafts,
  FailedCraftsSchema,
  OpenedArtifact,
  OpenedArtifactSchema,
  LockedMint,
  LockedMintSchema,
  LockedBurn,
  LockedBurnSchema,
} from 'src/user/user.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { ArtifactService } from 'src/artifact/artifact.service';
import { TransactionService } from 'src/database/transaction.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import {
  UserBalances,
  UserBalancesSchema,
} from 'src/user/user-balances.schema';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { UserBalancesService } from 'src/user/user-balances.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },

      { name: RefCode.name, schema: RefCodeSchema },
      {
        name: FailedCrafts.name,
        schema: FailedCraftsSchema,
      },
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

    BullModule.registerQueue({
      name: QUEUE_NAMES.FOLLOWERS,
    }),
  ],
  controllers: [AdminController],
  providers: [
    AdminService,
    UserService,
    BotService,
    AnalyticsService,

    ArtifactService,
    AppCacheService,
    TransactionService,
    UserBalancesService,
  ],
})
export class AdminModule {}
