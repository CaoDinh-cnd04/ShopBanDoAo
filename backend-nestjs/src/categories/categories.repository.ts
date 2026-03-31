import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoryRepository {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel
      .find()
      .sort({ displayOrder: 1, categoryName: 1 })
      .exec();
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    return new this.categoryModel(data).save();
  }

  async update(
    id: string,
    updateData: Partial<Category>,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async softDelete(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();
  }

  /** Thêm sub-category vào mảng nhúng */
  async addSubCategory(
    categoryId: string,
    sub: any,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $push: { subCategories: sub } },
        { new: true },
      )
      .exec();
  }

  /** Cập nhật một sub-category theo _id của nó */
  async updateSubCategory(
    categoryId: string,
    subId: string,
    data: any,
  ): Promise<CategoryDocument | null> {
    const setPayload: any = {};
    Object.keys(data).forEach((k) => {
      setPayload[`subCategories.$.${k}`] = data[k];
    });
    return this.categoryModel
      .findOneAndUpdate(
        {
          _id: categoryId,
          'subCategories._id': new Types.ObjectId(subId),
        },
        { $set: setPayload },
        { new: true },
      )
      .exec();
  }

  /** Xóa sub-category khỏi mảng nhúng */
  async removeSubCategory(
    categoryId: string,
    subId: string,
  ): Promise<CategoryDocument | null> {
    return this.categoryModel
      .findByIdAndUpdate(
        categoryId,
        {
          $pull: {
            subCategories: { _id: new Types.ObjectId(subId) },
          },
        },
        { new: true },
      )
      .exec();
  }
}
