import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CourtDocument = Court & Document;

@Schema({ timestamps: true })
export class Court {
  @Prop({ required: true })
  courtName: string;

  @Prop({ required: true })
  courtType: string; // e.g., 'Tennis', 'Badminton', 'Football'

  @Prop({ required: true, min: 0 })
  pricePerHour: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  description: string;

  @Prop()
  image: string;
}

export const CourtSchema = SchemaFactory.createForClass(Court);
