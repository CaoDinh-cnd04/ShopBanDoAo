import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findAll(match: any, skip: number, limit: number): Promise<UserDocument[]> {
    return this.userModel.find(match).skip(skip).limit(limit).select('-passwordHash').exec();
  }

  async count(match: any): Promise<number> {
    return this.userModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash').exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).select('-passwordHash').exec();
  }

  async softDelete(id: string): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, { isActive: false }, { new: true }).select('-passwordHash').exec();
  }
}
