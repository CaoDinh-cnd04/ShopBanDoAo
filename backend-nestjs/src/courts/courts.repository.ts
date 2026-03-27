import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Court, CourtDocument } from './schemas/court.schema';

@Injectable()
export class CourtRepository {
  constructor(
    @InjectModel(Court.name) private courtModel: Model<CourtDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
  ): Promise<CourtDocument[]> {
    return this.courtModel.find(match).skip(skip).limit(limit).exec();
  }

  async count(match: any): Promise<number> {
    return this.courtModel.countDocuments(match).exec();
  }

  async create(data: Partial<Court>): Promise<CourtDocument> {
    const newCourt = new this.courtModel(data);
    return newCourt.save();
  }

  async findById(id: string): Promise<CourtDocument | null> {
    return this.courtModel.findById(id).exec();
  }

  async update(
    id: string,
    updateData: Partial<Court>,
  ): Promise<CourtDocument | null> {
    return this.courtModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<CourtDocument | null> {
    return this.courtModel.findByIdAndDelete(id).exec();
  }
}
