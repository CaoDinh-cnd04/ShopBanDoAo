import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CourtType, CourtTypeDocument } from './schemas/court-type.schema';

@Injectable()
export class CourtTypeRepository {
  constructor(
    @InjectModel(CourtType.name)
    private courtTypeModel: Model<CourtTypeDocument>,
  ) {}

  async findAll(): Promise<CourtTypeDocument[]> {
    return this.courtTypeModel.find().sort({ typeName: 1 }).exec();
  }

  async findById(id: string): Promise<CourtTypeDocument | null> {
    return this.courtTypeModel.findById(id).exec();
  }

  async create(data: Partial<CourtType>): Promise<CourtTypeDocument> {
    return new this.courtTypeModel(data).save();
  }

  async update(
    id: string,
    data: Partial<CourtType>,
  ): Promise<CourtTypeDocument | null> {
    return this.courtTypeModel
      .findByIdAndUpdate(id, data, { new: true })
      .exec();
  }

  async delete(id: string): Promise<CourtTypeDocument | null> {
    return this.courtTypeModel.findByIdAndDelete(id).exec();
  }
}
