import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  async getMyAddresses(@Request() req: any) {
    return this.addressesService.getMyAddresses(req.user.userId);
  }

  @Post()
  async createAddress(
    @Request() req: any,
    @Body() createDto: CreateAddressDto,
  ) {
    return this.addressesService.createAddress(req.user.userId, createDto);
  }

  @Put(':id')
  async updateAddress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateDto: UpdateAddressDto,
  ) {
    return this.addressesService.updateAddress(req.user.userId, id, updateDto);
  }

  @Delete(':id')
  async deleteAddress(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.deleteAddress(req.user.userId, id);
  }
}
