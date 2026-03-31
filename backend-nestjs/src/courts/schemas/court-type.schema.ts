import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourtTypeDocument = CourtType & Document;

@Schema({ timestamps: true })
export class CourtType {
  @Prop({ required: true, trim: true })
  typeName: string;

  @Prop()
  description?: string;
}

export const CourtTypeSchema = SchemaFactory.createForClass(CourtType);
