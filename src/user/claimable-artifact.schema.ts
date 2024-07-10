import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Artifact } from 'src/artifact/artifact.schema';

@Schema()
export class ClaimableArtifact extends Document {
  @Prop({ type: Types.ObjectId, ref: Artifact.name })
  artifact: Artifact;

  @Prop({ required: true, default: 0 })
  count: number;
}

export const ClaimableArtifactSchema =
  SchemaFactory.createForClass(ClaimableArtifact);
