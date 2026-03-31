import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
      .populate('userId', 'fullName email phone')
      .populate('courtId', 'courtName courtType pricePerHour location address')
      .exec();
  }

  async count(match: any): Promise<number> {
    return this.bookingModel.countDocuments(match).exec();
  }

  async findById(id: string): Promise<BookingDocument | null> {
    return this.bookingModel
      .findById(id)
      .populate('userId', 'fullName email phone')
      .populate('courtId', 'courtName courtType pricePerHour location address')
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

  /** Lịch đặt trong ngày (không populate) — kiểm tra trùng slot */
  async findOccupiedForCourtOnDate(
    courtId: string,
    dayStart: Date,
    dayEnd: Date,
  ) {
    return this.bookingModel
      .find({
        courtId: new Types.ObjectId(courtId),
        bookingDate: { $gte: dayStart, $lte: dayEnd },
        bookingStatus: { $nin: ['cancelled', 'Cancelled', 'Đã hủy'] },
      })
      .select('slots startTime endTime bookingStatus')
      .lean()
      .exec();
  }
}
