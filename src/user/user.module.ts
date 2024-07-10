// user/user.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
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
} from './user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { Artifact, ArtifactSchema } from 'src/artifact/artifact.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { ReferralsService } from 'src/referrals/referrals-service/referrals.service';
import { RefCode, RefCodeSchema } from 'src/referrals/refCodes.schema';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { BotService } from 'src/bot/bot.service';
import { BatchRewards, BatchRewardsSchema } from './batch-rewards.schema';
import {
  ClaimableArtifact,
  ClaimableArtifactSchema,
} from './claimable-artifact.schema';
import { TransactionService } from 'src/database/transaction.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import {
  UserNotifications,
  UserNotificationsSchema,
} from './user-notifications.schema';
import { UserBalances, UserBalancesSchema } from './user-balances.schema';
import { UserBalancesService } from './user-balances.service';

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

    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.FOLLOWERS,
      },
      {
        name: QUEUE_NAMES.USER_CREATION,
      },
    ),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    ArtifactService,
    AppCacheService,
    ReferralsService,
    BotService,
    TransactionService,
    AnalyticsService,
    UserBalancesService,
  ],
  exports: [UserService, ArtifactService], // Export UserService for other modules to use
})
export class UserModule {}
