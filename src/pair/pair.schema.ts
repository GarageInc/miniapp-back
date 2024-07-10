import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.schema';

@Schema()
export class Pair extends Document {
  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  first: Artifact;

  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  second: Artifact;

  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  matchResult: Artifact;
}

export const PairSchema = SchemaFactory.createForClass(Pair);
