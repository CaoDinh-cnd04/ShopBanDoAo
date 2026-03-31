import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { VoucherRepository } from './vouchers.repository';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  QueryVoucherDto,
} from './dto/voucher.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class VouchersService {
  constructor(private voucherRepository: VoucherRepository) {}

  async createVoucher(createDto: CreateVoucherDto) {
    const existing = await this.voucherRepository.findByCode(createDto.code);
    if (existing) throw new BadRequestException('Mã voucher đã tồn tại');

    // cast date string to date object if necessary, handled automatically by class-validator if configured,
    // but manually assigning to be safe
    const payload = {
      ...createDto,
      code: createDto.code.trim().toUpperCase(),
      voucherName: createDto.voucherName?.trim() ?? '',
      description: createDto.description?.trim() ?? '',
      startDate: new Date(createDto.startDate),
      endDate: new Date(createDto.endDate),
    };
    const voucher = await this.voucherRepository.create(payload);
    return { message: 'Tạo mã giảm giá thành công', voucher };
  }

  async getAllVouchers(query: QueryVoucherDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit || '20', 10) || 20),
    );
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {};
    const q = query.search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      match.$or = [{ code: rx }, { voucherName: rx }, { description: rx }];
    }
    if (query.isActive !== undefined && query.isActive !== '') {
      match.isActive = query.isActive === 'true';
    }
    const now = new Date();
    if (query.isExpired !== undefined && query.isExpired !== '') {
      if (query.isExpired === 'true') {
        match.endDate = { $lt: now };
      } else {
        match.endDate = { $gte: now };
      }
    }

    const [vouchers, total] = await Promise.all([
      this.voucherRepository.findAll(match, skip, limit),
      this.voucherRepository.count(match),
    ]);

    return {
      vouchers,
      pagination: {
        currentPage: page,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  async applyVoucher(code: string, orderValue: number) {
    const voucher = await this.voucherRepository.findByCode(code);
    if (!voucher)
      throw new NotFoundException('Mã giảm giá không hợp lệ hoặc đã hết hạn');

    if (!voucher.isActive) {
      throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
    }

    const now = new Date();
    if (now < voucher.startDate || now > voucher.endDate) {
      throw new BadRequestException(
        'Mã giảm giá chưa đến ngày áp dụng hoặc đã hết hạn',
      );
    }

    if (voucher.usageLimit <= voucher.usedCount) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    }

    if (voucher.minOrderValue && orderValue < voucher.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu phải đạt ${voucher.minOrderValue}đ để áp dụng mã này`,
      );
    }

    let discountAmount = 0;
    if (voucher.discountType === 'fixed') {
      discountAmount = voucher.discountValue;
    } else if (voucher.discountType === 'percent') {
      discountAmount = (orderValue * voucher.discountValue) / 100;
      if (
        voucher.maxDiscountAmount &&
        discountAmount > voucher.maxDiscountAmount
      ) {
        discountAmount = voucher.maxDiscountAmount;
      }
    }

    return {
      message: 'Áp dụng mã thành công',
      discountAmount: Math.round(discountAmount),
      voucherCode: voucher.code,
      voucherName: voucher.voucherName || '',
    };
  }

  async updateVoucher(id: string, updateDto: UpdateVoucherDto) {
    const payload: any = { ...updateDto };
    if (updateDto.startDate) payload.startDate = new Date(updateDto.startDate);
    if (updateDto.endDate) payload.endDate = new Date(updateDto.endDate);

    const voucher = await this.voucherRepository.update(id, payload);
    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return { message: 'Cập nhật mã giảm giá thành công', voucher };
  }

  async deleteVoucher(id: string) {
    const voucher = await this.voucherRepository.softDeactivate(id);
    if (!voucher) throw new NotFoundException('Không tìm thấy mã giảm giá');
    return { message: 'Đã vô hiệu hóa mã giảm giá' };
  }

  async getPublicVouchers() {
    const now = new Date();
    const vouchers = await this.voucherRepository.findAll(
      { isActive: true, startDate: { $lte: now }, endDate: { $gte: now } },
      0,
      50,
    );
    return { vouchers };
  }

  async getVoucherStats() {
    const now = new Date();
    const [totalVouchers, activeVouchers, expiredVouchers] = await Promise.all([
      this.voucherRepository.count({}),
      this.voucherRepository.count({ isActive: true, endDate: { $gte: now } }),
      this.voucherRepository.count({ endDate: { $lt: now } }),
    ]);
    return { totalVouchers, activeVouchers, expiredVouchers };
  }
}
