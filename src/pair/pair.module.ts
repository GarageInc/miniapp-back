import { Module } from '@nestjs/common';
import { PairService } from './pair.service';
import { PairController } from './pair.controller';
import { Pair, PairSchema } from './pair.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { Artifact, ArtifactSchema } from 'src/artifact/artifact.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
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
    MongooseModule.forFeature([]),
    MongooseModule.forFeature([
      { name: Artifact.name, schema: ArtifactSchema },
      { name: Pair.name, schema: PairSchema },
      { name: RefCode.name, schema: RefCodeSchema },

      {
        name: FailedCrafts.name,
        schema: FailedCraftsSchema,
      },
      { name: OpenedArtifact.name, schema: OpenedArtifactSchema },

      { name: ClaimableArtifact.name, schema: ClaimableArtifactSchema },
      { name: BatchRewards.name, schema: BatchRewardsSchema },
      { name: User.name, schema: UserSchema },
      { name: LockedMint.name, schema: LockedMintSchema },
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
    PairService,
    ArtifactService,
    UserService,
    AppCacheService,
    TransactionService,

    AnalyticsService,
    UserBalancesService,
  ],
  exports: [PairService],
  controllers: [PairController],
})
export class PairModule {}
