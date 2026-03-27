import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';

@Injectable()
export class BookingRepository {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async findAll(
    match: any,
    skip: number,
    limit: number,
  ): Promise<BookingDocument[]> {
    return this.bookingModel
      .find(match)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'fullName email phoneNumber')
      .populate('courtId', 'courtName courtType pricePerHour') // Mẫu nếu có collection Court
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.bookingModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<BookingDocument | null> {
    return this.bookingModel
      .findById(id)
      .populate('userId', 'fullName email phoneNumber')
      .populate('courtId')
      .exec();
  }

  async create(data: Partial<Booking>): Promise<BookingDocument> {
    const newBooking = new this.bookingModel(data);
    return newBooking.save();
  }

  async update(
    id: string,
    updateData: Partial<Booking>,
  ): Promise<BookingDocument | null> {
    return this.bookingModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<BookingDocument | null> {
    return this.bookingModel.findByIdAndDelete(id).exec();
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return this.bookingModel.aggregate(pipeline).exec();
  }
}
