import { Module } from '@nestjs/common';
import { Web3Service } from './web3.service';
import { NftController } from './nft.controller';
import { BullModule } from '@nestjs/bull';
import { QUEUE_NAMES } from 'src/queue';
import { Artifact, ArtifactSchema } from 'src/artifact/artifact.schema';
import { ArtifactService } from 'src/artifact/artifact.service';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import {
  User,
  UserSchema,
  OpenedArtifact,
  OpenedArtifactSchema,
  LockedMint,
  LockedMintSchema,
  LockedBurn,
  LockedBurnSchema,
  FailedCrafts,
  FailedCraftsSchema,
} from 'src/user/user.schema';
import { UserService } from 'src/user/user.service';
import { AppCacheService } from 'src/app-cache/app-cache.service';
import { LockedBurnsService } from 'src/tasks/locked-burns.service';
import { LockedMintsService } from 'src/tasks/locked-mints.service';
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
    BullModule.registerQueue(
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
    ),

    HttpModule,
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
        name: UserBalances.name,
        schema: UserBalancesSchema,
      },
    ]),
  ],
  providers: [
    Web3Service,
    ArtifactService,
    UserService,
    AppCacheService,

    LockedMintsService,
    LockedBurnsService,

    TransactionService,

    AnalyticsService,
    UserBalancesService,
  ],
  controllers: [NftController],
})
export class Web3Module {}
