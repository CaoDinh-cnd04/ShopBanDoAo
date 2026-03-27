import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AddressRepository } from './addresses.repository';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private addressRepository: AddressRepository) {}

  async getMyAddresses(userId: string) {
    const addresses = await this.addressRepository.findAllByUser(userId);
    return { addresses };
  }

  async createAddress(userId: string, createDto: CreateAddressDto) {
    if (createDto.isDefault) {
      await this.addressRepository.unsetDefaultAddress(userId);
    }

    // Đảm bảo là nếu chưa có thì gán default luôn
    const existing = await this.addressRepository.findAllByUser(userId);
    if (existing.length === 0) {
      createDto.isDefault = true;
    }

    const payload = {
      ...createDto,
      userId: new Types.ObjectId(userId),
    };
    const address = await this.addressRepository.create(payload);
    return { message: 'Thêm địa chỉ thành công', address };
  }

  async updateAddress(userId: string, id: string, updateDto: UpdateAddressDto) {
    const address = await this.addressRepository.findByIdAndUser(id, userId);
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');

    if (updateDto.isDefault) {
      await this.addressRepository.unsetDefaultAddress(userId);
    }

    const updated = await this.addressRepository.update(id, updateDto);
    return { message: 'Cập nhật địa chỉ thành công', address: updated };
  }

  async deleteAddress(userId: string, id: string) {
    const address = await this.addressRepository.findByIdAndUser(id, userId);
    if (!address) throw new NotFoundException('Không tìm thấy địa chỉ');

    await this.addressRepository.delete(id);
    return { message: 'Xóa địa chỉ thành công' };
  }
}
