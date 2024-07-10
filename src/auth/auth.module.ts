import { Module } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
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
} from 'src/user/user.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { Artifact, ArtifactSchema } from 'src/artifact/artifact.schema';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import {
  BatchRewards,
  BatchRewardsSchema,
} from 'src/user/batch-rewards.schema';
import {
  ClaimableArtifact,
  ClaimableArtifactSchema,
} from 'src/user/claimable-artifact.schema';
import { RefCode, RefCodeSchema } from 'src/referrals/refCodes.schema';
import { TransactionService } from 'src/database/transaction.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import {
  UserNotifications,
  UserNotificationsSchema,
} from 'src/user/user-notifications.schema';
import {
  UserBalances,
  UserBalancesSchema,
} from 'src/user/user-balances.schema';
import { UserBalancesService } from 'src/user/user-balances.service';

@Module({
  providers: [
    UserService,
    ArtifactService,
    AppCacheService,
    TransactionService,

    AnalyticsService,
    UserBalancesService,
  ],

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
  ],
})
export class AuthModule {}
