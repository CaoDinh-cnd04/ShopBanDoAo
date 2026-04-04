import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Promotion, PromotionDocument } from './schemas/promotion.schema';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsRepository {
  constructor(
    @InjectModel(Promotion.name)
    private readonly model: Model<PromotionDocument>,
  ) {}

  async findAll(): Promise<PromotionDocument[]> {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  /** Trả về chương trình đang active: isActive=true và today trong [startDate, endDate] */
  async findActive(): Promise<PromotionDocument[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    return this.model
      .find({ isActive: true, startDate: { $lte: endOfToday }, endDate: { $gte: startOfToday } })
      .exec();
  }

  /** Chương trình active cho một danh mục cụ thể */
  async findActiveForCategory(categoryId: string): Promise<PromotionDocument[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const catObjId = new Types.ObjectId(categoryId);
    return this.model
      .find({
        isActive: true,
        startDate: { $lte: endOfToday },
        endDate: { $gte: startOfToday },
        $or: [
          { targetType: 'all' },
          { targetType: 'category', targetCategoryIds: catObjId },
        ],
      })
      .exec();
  }

  async findById(id: string): Promise<PromotionDocument | null> {
    return this.model.findById(id).exec();
  }

  async create(dto: CreatePromotionDto): Promise<PromotionDocument> {
    const doc = new this.model({
      ...dto,
      targetCategoryIds: (dto.targetCategoryIds ?? []).map(
        (id) => new Types.ObjectId(id),
      ),
    });
    return doc.save();
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<PromotionDocument | null> {
    const update: Record<string, unknown> = { ...dto };
    if (dto.targetCategoryIds) {
      update.targetCategoryIds = dto.targetCategoryIds.map(
        (cid) => new Types.ObjectId(cid),
      );
    }
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await this.model.findByIdAndDelete(id).exec();
  }
}
