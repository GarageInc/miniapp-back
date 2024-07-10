import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/user.schema';

@Schema()
export class RefCode extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name })
  author: User;

  @Prop({ required: true })
  code: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const RefCodeSchema = SchemaFactory.createForClass(RefCode);
