import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId, Types } from 'mongoose';
import { User } from './user.schema';
import { ClaimableArtifact } from './claimable-artifact.schema';
import { mapUserToDto } from 'src/utils/dto';
import { toArtifactDto } from 'src/artifact/dto';

export const mapBatchReward = (user: User, b: BatchRewards) => ({
  level: b.level,
  claimableArtifacts: b.claimableArtifacts.map((a) => ({
    _id: a._id,
    artifact: toArtifactDto(a.artifact),
    count: a.count,
  })),
  itemRegenerationTime: b.itemRegenerationTime,
  itemRegenerationTimeDelta: b.itemRegenerationTimeDelta,
  giftSlotsAmount: b.giftSlotsAmount,
  newGiftSlotsAmount: Math.max(
    0,
    b.giftSlotsAmount - user.claimableSlots.length,
  ),
  isClaimed: b.isClaimed,
  _id: b._id,
  triggeredByUser: b.triggeredByUser
    ? mapUserToDto(b.triggeredByUser as any)
    : null,
  canSeeFailedCrafts: b.canSeeFailedCrafts,
});

@Schema()
export class BatchRewards extends Document {
  @Prop({ required: true })
  level: number;

  @Prop({ type: [Types.ObjectId], ref: ClaimableArtifact.name, default: [] })
  claimableArtifacts: ClaimableArtifact[];

  @Prop({ required: false, default: 120 * 60 * 1000 })
  itemRegenerationTime: number;

  @Prop({ required: false, default: 0 })
  itemRegenerationTimeDelta: number;

  @Prop({ required: false, default: 3 })
  giftSlotsAmount: number;

  @Prop({ required: false, default: false })
  isClaimed: boolean;

  @Prop({ type: Types.ObjectId })
  triggeredByUser: ObjectId;

  @Prop({ required: false, default: false })
  canSeeFailedCrafts: boolean;
}

export const BatchRewardsSchema = SchemaFactory.createForClass(BatchRewards);
