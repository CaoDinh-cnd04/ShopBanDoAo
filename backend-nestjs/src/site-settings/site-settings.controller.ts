import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SiteSettingsService } from './site-settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/site-settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  /** Công khai — trang chủ đọc banner */
  @Get('banner')
  async getBanner() {
    return this.siteSettingsService.getBanner();
  }

  /** Chỉ Admin — lưu banner vào MongoDB */
  @Put('banner')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async putBanner(@Body() body: Record<string, unknown>) {
    return this.siteSettingsService.setBanner(body);
  }
}
