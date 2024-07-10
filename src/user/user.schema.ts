/* eslint-disable prettier/prettier */
// user/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.schema';
import { Pair } from 'src/pair/pair.schema';
import { APP_CONFIGS } from 'src/utils/app-configs';
import { BatchRewards } from './batch-rewards.schema';

@Schema()
export class OpenedArtifact extends Document {
  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  artifact: Artifact;

  @Prop({ required: true, default: Date.now })
  openedDate: Date;

  @Prop({ required: true, default: 0 })
  count: number;

  @Prop({ required: false, default: 10 })
  maxAmount: number;
}

export enum MINT_STATUS {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum BURN_STATUS {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export const getCurrentTimePlusCooldown = (multiplier = 1) => {
  const date = new Date();
  date.setMilliseconds(
    date.getMilliseconds() +
      APP_CONFIGS.DEFAULT_COOLDOWN_GIFT_ARTIFACT * multiplier,
  );
  return date;
};

@Schema()
export class User extends Document {
  @Prop({ required: true, index: true })
  telegramId: number;

  @Prop({ required: false })
  chatId: number;

  @Prop({ required: false })
  username: string;

  @Prop({ required: false, default: APP_CONFIGS.DEFAULT_LANGUAGE })
  language: string;

  @Prop({ required: false, default: false })
  is_bot: boolean;

  @Prop({ required: false })
  first_name: string;

  @Prop({ required: false })
  last_name: string;

  @Prop({ required: false, index: true })
  referredByCode: string;

  @Prop({ required: false })
  source: string;

  @Prop({ required: false })
  photoUrl: string;

  @Prop({ required: false })
  tonAddress: string;

  @Prop({
    required: true,
    default: [],
  })
  claimableSlots: Date[];

  @Prop({ type: [Types.ObjectId], ref: Artifact.name })
  inventory: OpenedArtifact[];

  @Prop({ type: [Types.ObjectId], ref: BatchRewards.name })
  batchRewards: BatchRewards[];

  @Prop({ type: [Types.ObjectId], ref: Pair.name, default: [] })
  craftedHistory: Pair[];

  @Prop({ required: false, default: 1 })
  level: number;

  @Prop({ required: false, default: 45 })
  maxInventorySize: number;

  @Prop({ required: false, default: 0 })
  lastFriendsClaimedAmount: number;

  @Prop({ required: false, default: 120 * 60 * 1000 })
  itemRegenerationTime: number;

  @Prop({ required: false, default: 0 })
  invitedUsersAmount: number;

  @Prop({ required: false, default: false })
  notifiedAboutGifts: boolean;

  @Prop({ required: false, default: 0 })
  claimableRewardsAmount: number;
}

@Schema()
export class FailedCrafts {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  user: User;

  @Prop({
    type: Types.ObjectId,
    ref: Artifact.name,
    required: true,
    index: true,
  })
  artifactFirst: Artifact;

  @Prop({
    type: Types.ObjectId,
    ref: Artifact.name,
    required: true,
    index: true,
  })
  artifactSecond: Artifact;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

@Schema()
export class LockedMint extends Document {
  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  artifact: Artifact;

  @Prop({ required: true, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ required: true })
  txHash: string;

  @Prop({ required: false, default: false, index: true })
  status: MINT_STATUS;

  @Prop({ required: false })
  mintedDate: Date;

  @Prop({ type: Types.ObjectId, ref: User.name })
  user: User;

  @Prop({ required: true })
  nftIndex: string;

  @Prop({ required: true })
  targetAddress: string;
}

@Schema()
export class LockedBurn extends Document {
  @Prop({ required: true, default: Date.now, index: true })
  createdAt: Date;

  @Prop({ required: false, default: false })
  status: BURN_STATUS;

  @Prop({ type: Types.ObjectId, ref: User.name, index: true })
  user: User;

  @Prop({ required: true })
  nftIndex: string;

  @Prop({ required: true })
  targetAddress: string;
}

export const LockedMintSchema = SchemaFactory.createForClass(LockedMint);

export const LockedBurnSchema = SchemaFactory.createForClass(LockedBurn);

export const UserSchema = SchemaFactory.createForClass(User);

export const OpenedArtifactSchema =
  SchemaFactory.createForClass(OpenedArtifact);

export const FailedCraftsSchema = SchemaFactory.createForClass(FailedCrafts);
