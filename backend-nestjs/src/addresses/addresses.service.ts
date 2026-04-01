import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { AddressRepository } from './addresses.repository';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { AddressDocument } from './schemas/address.schema';

@Injectable()
export class AddressesService {
  constructor(private addressRepository: AddressRepository) {}

  /** Trả về khớp frontend: phone, address (street DB) */
  private toClient(
    doc: AddressDocument | Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!doc) return null;
    const o =
      typeof (doc as AddressDocument).toObject === 'function'
        ? (doc as AddressDocument).toObject()
        : (doc as Record<string, unknown>);
    return {
      _id: o._id,
      fullName: o.fullName,
      phone: o.phoneNumber,
      address: o.street,
      ward: o.ward,
      district: o.district,
      city: o.city,
      isDefault: !!o.isDefault,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  }

  async getMyAddresses(userId: string) {
    const addresses = await this.addressRepository.findAllByUser(userId);
    return {
      addresses: addresses
        .map((a) => this.toClient(a))
        .filter(Boolean) as Record<string, unknown>[],
    };
  }

  async createAddress(userId: string, createDto: CreateAddressDto) {
    const existing = await this.addressRepository.findAllByUser(userId);
    const isFirst = existing.length === 0;
    const wantDefault = createDto.isDefault === true || isFirst;

    if (wantDefault) {
      await this.addressRepository.unsetDefaultAddress(userId);
    }

    const payload = {
      userId: new Types.ObjectId(userId),
      fullName: createDto.fullName.trim(),
      phoneNumber: createDto.phone.trim(),
      street: createDto.address.trim(),
      ward: createDto.ward.trim(),
      district: createDto.district.trim(),
      city: createDto.city.trim(),
      isDefault: wantDefault,
    };

    const address = await this.addressRepository.create(payload);
    return {
      message: 'Thêm địa chỉ thành công',
      address: this.toClient(address),
    };
  }

  async updateAddress(userId: string, id: string, updateDto: UpdateAddressDto) {
    const address = await this.addressRepository.findByIdAndUser(id, userId);
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');

    if (updateDto.isDefault === true) {
      await this.addressRepository.unsetDefaultAddress(userId);
    }

    const patch: Record<string, unknown> = {};
    if (updateDto.fullName !== undefined) {
      patch.fullName = updateDto.fullName.trim();
    }
    if (updateDto.phone !== undefined) {
      if (!updateDto.phone.trim()) {
        throw new BadRequestException('Số điện thoại không hợp lệ');
      }
      patch.phoneNumber = updateDto.phone.trim();
    }
    if (updateDto.address !== undefined) {
      if (!updateDto.address.trim()) {
        throw new BadRequestException('Địa chỉ không được để trống');
      }
      patch.street = updateDto.address.trim();
    }
    if (updateDto.ward !== undefined) patch.ward = updateDto.ward.trim();
    if (updateDto.district !== undefined) {
      patch.district = updateDto.district.trim();
    }
    if (updateDto.city !== undefined) patch.city = updateDto.city.trim();
    if (updateDto.isDefault === true) patch.isDefault = true;

    const updated = await this.addressRepository.update(id, patch as any);
    return {
      message: 'Cập nhật địa chỉ thành công',
      address: this.toClient(updated),
    };
  }

  async setDefaultAddress(userId: string, id: string) {
    const address = await this.addressRepository.findByIdAndUser(id, userId);
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');
    await this.addressRepository.unsetDefaultAddress(userId);
    const updated = await this.addressRepository.update(id, {
      isDefault: true,
    });
    return {
      message: 'Đã đặt làm địa chỉ mặc định',
      address: this.toClient(updated),
    };
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.addressRepository.findByIdAndUser(id, userId);
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');

    const wasDefault = address.isDefault;
    await this.addressRepository.delete(id);

    if (wasDefault) {
      const remaining = await this.addressRepository.findAllByUser(userId);
      if (remaining.length > 0) {
        await this.addressRepository.update(String(remaining[0]._id), {
          isDefault: true,
        });
      }
    }

    return { message: 'Xóa địa chỉ thành công' };
  }
}
