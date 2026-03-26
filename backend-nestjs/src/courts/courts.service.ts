import { Injectable, NotFoundException } from '@nestjs/common';
import { CourtRepository } from './courts.repository';
import { CreateCourtDto, UpdateCourtDto, QueryCourtDto } from './dto/court.dto';

@Injectable()
export class CourtsService {
  constructor(private courtRepository: CourtRepository) {}

  async createCourt(createDto: CreateCourtDto) {
    const court = await this.courtRepository.create(createDto);
    return { message: 'Thêm sân thể thao thành công', court };
  }

  async getAllCourts(query: QueryCourtDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.courtType) match.courtType = query.courtType;
    if (query.isActive !== undefined) match.isActive = query.isActive === 'true';

    const [courts, total] = await Promise.all([
      this.courtRepository.findAll(match, skip, limit),
      this.courtRepository.count(match),
    ]);

    return {
      courts,
      pagination: { currentPage: page, totalPages: Math.ceil(total / limit), totalItems: total, limit },
    };
  }

  async getCourtById(id: string) {
    const court = await this.courtRepository.findById(id);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return court;
  }

  async updateCourt(id: string, updateDto: UpdateCourtDto) {
    const court = await this.courtRepository.update(id, updateDto);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return { message: 'Cập nhật sân thành công', court };
  }

  async deleteCourt(id: string) {
    const court = await this.courtRepository.delete(id);
    if (!court) throw new NotFoundException('Không tìm thấy sân');
    return { message: 'Xóa sân thành công' };
  }
}
