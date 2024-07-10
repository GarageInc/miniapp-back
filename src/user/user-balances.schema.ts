import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema()
export class UserBalances extends Document {
  @Prop({ type: Types.ObjectId, unique: true, index: true })
  user: User;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const UserBalancesSchema = SchemaFactory.createForClass(UserBalances);
