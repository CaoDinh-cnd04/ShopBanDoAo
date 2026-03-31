import { BadRequestException, Injectable } from '@nestjs/common';
import { SiteSettingsRepository } from './site-settings.repository';

@Injectable()
export class SiteSettingsService {
  constructor(private readonly repo: SiteSettingsRepository) {}

  async getBanner(): Promise<Record<string, unknown> | null> {
    const doc = await this.repo.getSingleton();
    if (!doc?.banner || typeof doc.banner !== 'object') return null;
    return doc.banner as Record<string, unknown>;
  }

  async setBanner(body: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      throw new BadRequestException('Body phải là object JSON');
    }
    await this.repo.upsertBanner(body);
    return body;
  }
}
