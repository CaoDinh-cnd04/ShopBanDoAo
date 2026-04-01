import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from '../bookings/schemas/booking.schema';
import { CourtRepository } from './courts.repository';
import { CourtTypeRepository } from './courts-type.repository';
import {
  CreateCourtDto,
  UpdateCourtDto,
  QueryCourtDto,
  CreateCourtTypeDto,
  UpdateCourtTypeDto,
} from './dto/court.dto';

@Injectable()
export class CourtsService {
  constructor(
    private courtRepository: CourtRepository,
    private courtTypeRepository: CourtTypeRepository,
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  // ─── Court Types ────────────────────────────────────────────────────
  async getAllCourtTypes() {
    return this.courtTypeRepository.findAll();
  }

  async createCourtType(dto: CreateCourtTypeDto) {
    const type = await this.courtTypeRepository.create(dto);
    return { message: 'Tạo loại sân thành công', courtType: type };
  }

  async updateCourtType(id: string, dto: UpdateCourtTypeDto) {
    const type = await this.courtTypeRepository.update(id, dto);
    if (!type) throw new NotFoundException('Không tìm thấy loại sân');
    return { message: 'Cập nhật loại sân thành công', courtType: type };
  }

  async deleteCourtType(id: string) {
    const type = await this.courtTypeRepository.delete(id);
    if (!type) throw new NotFoundException('Không tìm thấy loại sân');
    return { message: 'Đã xóa loại sân' };
  }

  // ─── Courts ─────────────────────────────────────────────────────────
  async createCourt(createDto: CreateCourtDto) {
    const payload: any = { ...createDto };
    if (payload.courtTypeId) {
      const t = await this.courtTypeRepository.findById(payload.courtTypeId);
      if (!t) throw new BadRequestException('Không tìm thấy loại sân');
      payload.courtType = t.typeName;
    }
    if (!payload.courtType?.trim()) {
      throw new BadRequestException(
        'Thiếu loại sân (chọn loại hoặc gửi courtType)',
      );
    }
    payload.courtType = String(payload.courtType).trim();
    if (!payload.pricePerHour) payload.pricePerHour = 0;
    const court = await this.courtRepository.create(payload);
    return { message: 'Thêm sân thể thao thành công', court };
  }

  async getAllCourts(query: QueryCourtDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '50');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.courtType) match.courtType = query.courtType;
    if (query.isActive !== undefined)
      match.isActive = query.isActive === 'true';

    const [courts] = await Promise.all([
      this.courtRepository.findAll(match, skip, limit),
      this.courtRepository.count(match),
    ]);

    return courts;
  }

  async getCourtById(id: string) {
    const court = await this.courtRepository.findById(id);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return court;
  }

  async updateCourt(id: string, updateDto: UpdateCourtDto) {
    const payload: any = { ...updateDto };
    if (payload.courtTypeId) {
      const t = await this.courtTypeRepository.findById(payload.courtTypeId);
      if (!t) throw new BadRequestException('Không tìm thấy loại sân');
      payload.courtType = t.typeName;
    } else if (payload.courtType != null) {
      payload.courtType = String(payload.courtType).trim();
    }
    const court = await this.courtRepository.update(id, payload);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return { message: 'Cập nhật sân thành công', court };
  }

  async deleteCourt(id: string) {
    const court = await this.courtRepository.update(id, { isActive: false });
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return { message: 'Đã ngừng hoạt động sân' };
  }

  async getCourtStats() {
    const [totalCourts, activeCourts, totalBookings] = await Promise.all([
      this.courtRepository.count({}),
      this.courtRepository.count({ isActive: true }),
      this.bookingModel.countDocuments({}).exec(),
    ]);
    return { totalCourts, activeCourts, totalBookings };
  }
}
