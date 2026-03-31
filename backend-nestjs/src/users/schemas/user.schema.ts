import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  /**
   * Trùng với index `username_1` trên DB (legacy): unique không cho phép nhiều bản ghi `username: null`.
   * Luôn gán khi tạo user (thường = email đã chuẩn hóa).
   */
  @Prop({ sparse: true })
  username?: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: 'User' })
  role: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: null })
  phone: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
