import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

@Schema()
export class UserNotifications extends Document {
  @Prop({ type: Types.ObjectId, unique: true, index: true })
  user: User;

  @Prop({ default: Date.now })
  nextLoginNotificationDate: Date;
}

export const UserNotificationsSchema =
  SchemaFactory.createForClass(UserNotifications);
