import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  SiteSettings,
  SiteSettingsSchema,
} from './schemas/site-settings.schema';
import { SiteSettingsRepository } from './site-settings.repository';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsController } from './site-settings.controller';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: SiteSettings.name, schema: SiteSettingsSchema },
    ]),
  ],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsRepository, SiteSettingsService],
})
export class SiteSettingsModule {}
