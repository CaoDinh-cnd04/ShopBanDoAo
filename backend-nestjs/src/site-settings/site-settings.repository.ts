import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SiteSettings,
  SiteSettingsDocument,
} from './schemas/site-settings.schema';

@Injectable()
export class SiteSettingsRepository {
  constructor(
    @InjectModel(SiteSettings.name)
    private readonly model: Model<SiteSettingsDocument>,
  ) {}

  async getSingleton(): Promise<SiteSettingsDocument | null> {
    return this.model.findOne().exec();
  }

  async upsertBanner(banner: Record<string, unknown>): Promise<void> {
    const existing = await this.model.findOne().exec();
    if (existing) {
      existing.banner = banner;
      await existing.save();
      return;
    }
    await this.model.create({ banner });
  }
}
