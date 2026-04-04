import { Injectable, NotFoundException } from '@nestjs/common';
import { PromotionsRepository } from './promotions.repository';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(private readonly repo: PromotionsRepository) {}

  findAll() {
    return this.repo.findAll();
  }

  findActive() {
    return this.repo.findActive();
  }

  findActiveForCategory(categoryId: string) {
    return this.repo.findActiveForCategory(categoryId);
  }

  async findById(id: string) {
    const doc = await this.repo.findById(id);
    if (!doc) throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    return doc;
  }

  create(dto: CreatePromotionDto) {
    return this.repo.create(dto);
  }

  async update(id: string, dto: UpdatePromotionDto) {
    const doc = await this.repo.update(id, dto);
    if (!doc) throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    return doc;
  }

  async delete(id: string) {
    await this.findById(id);
    await this.repo.delete(id);
    return { message: 'Đã xoá chương trình khuyến mãi' };
  }
}
