import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class AuthRepository {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /** Khớp email không phân biệt hoa/thường (dữ liệu cũ có thể lưu sai casing) */
  async findByEmail(email: string): Promise<UserDocument | null> {
    const trimmed = email.trim();
    if (!trimmed) return null;
    return this.userModel
      .findOne({
        email: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
      })
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(userData: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }
}
