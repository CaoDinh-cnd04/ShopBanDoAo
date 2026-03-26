import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address, AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressRepository {
  constructor(@InjectModel(Address.name) private addressModel: Model<AddressDocument>) {}

  async findAllByUser(userId: string): Promise<AddressDocument[]> {
    return this.addressModel.find({ userId: new Types.ObjectId(userId) }).sort({ isDefault: -1 }).exec();
  }

  async findByIdAndUser(id: string, userId: string): Promise<AddressDocument | null> {
    return this.addressModel.findOne({ _id: id, userId: new Types.ObjectId(userId) }).exec();
  }

  async create(data: Partial<Address>): Promise<AddressDocument> {
    const newAddress = new this.addressModel(data);
    return newAddress.save();
  }

  async update(id: string, updateData: Partial<Address>): Promise<AddressDocument | null> {
    return this.addressModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<AddressDocument | null> {
    return this.addressModel.findByIdAndDelete(id).exec();
  }

  async unsetDefaultAddress(userId: string): Promise<void> {
    await this.addressModel.updateMany({ userId: new Types.ObjectId(userId) }, { isDefault: false });
  }
}
