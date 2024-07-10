import { Module } from '@nestjs/common';
import { ArtifactService } from './artifact.service';
import { ArtifactController } from './artifact.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Artifact, ArtifactSchema } from './artifact.schema';
import { UserService } from 'src/user/user.service';
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
  UserBalances,
  UserBalancesSchema,
} from 'src/user/user-balances.schema';
import { UserBalancesService } from 'src/user/user-balances.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Artifact.name, schema: ArtifactSchema },
      { name: OpenedArtifact.name, schema: OpenedArtifactSchema },

      { name: RefCode.name, schema: RefCodeSchema },
      { name: ClaimableArtifact.name, schema: ClaimableArtifactSchema },
      {
        name: FailedCrafts.name,
        schema: FailedCraftsSchema,
      },
      { name: BatchRewards.name, schema: BatchRewardsSchema },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: LockedMint.name,
        schema: LockedMintSchema,
      },
      {
        name: LockedBurn.name,
        schema: LockedBurnSchema,
      },
      {
        name: UserBalances.name,
        schema: UserBalancesSchema,
      },
    ]),
  ],
  providers: [
    ArtifactService,
    UserService,
    AppCacheService,
    TransactionService,
    AnalyticsService,
    UserBalancesService,
  ],

  controllers: [ArtifactController],
})
export class ArtifactModule {}
