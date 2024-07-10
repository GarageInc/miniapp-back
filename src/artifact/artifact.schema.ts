import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Artifact extends Document<string> {
  @Prop({ required: true, index: true })
  id: string;

  @Prop({ required: true })
  logoUrl: string;

  @Prop({ required: false })
  backgroundColor: string;

  @Prop({ required: false })
  strokeColor: string;

  @Prop({ required: false })
  gifUrl: string;

  @Prop({ required: false })
  thumbnailUrl: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false })
  description: string;

  @Prop({ required: true })
  level: number;

  @Prop({ required: true })
  mintingPrice: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, default: Date.now })
  updatedAt: Date;
}

export const ArtifactSchema = SchemaFactory.createForClass(Artifact);
