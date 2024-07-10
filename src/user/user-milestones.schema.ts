import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema()
export class UserMilestones extends Document {
  @Prop({ type: Types.ObjectId, unique: true, index: true })
  user: User;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserMilestonesSchema =
  SchemaFactory.createForClass(UserMilestones);
