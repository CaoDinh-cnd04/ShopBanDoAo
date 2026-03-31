import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SiteSettingsDocument = SiteSettings & Document;

/** Một bản ghi singleton: cấu hình site (banner trang chủ, …) */
@Schema({ collection: 'sitesettings', timestamps: true })
export class SiteSettings {
  @Prop({ type: Object, default: {} })
  banner: Record<string, unknown>;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);
