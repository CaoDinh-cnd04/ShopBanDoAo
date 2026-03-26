import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoryRepository {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  async findAll(): Promise<CategoryDocument[]> {
    return this.categoryModel.find({ isActive: true }).exec();
  }

  async findById(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findById(id).exec();
  }

  async create(data: Partial<Category>): Promise<CategoryDocument> {
    const newCategory = new this.categoryModel(data);
    return newCategory.save();
  }

  async update(id: string, updateData: Partial<Category>): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async softDelete(id: string): Promise<CategoryDocument | null> {
    return this.categoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).exec();
  }
}
