import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto, UpdateVoucherDto, QueryVoucherDto } from './dto/voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // PUBLIC/USER ROUTES
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyVoucher(@Body('code') code: string, @Body('orderValue') orderValue: number) {
    return this.vouchersService.applyVoucher(code, orderValue);
  }

  // ADMIN ROUTES
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async getAllVouchers(@Query() queryDto: QueryVoucherDto) {
    return this.vouchersService.getAllVouchers(queryDto);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createVoucher(@Body() createDto: CreateVoucherDto) {
    return this.vouchersService.createVoucher(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateVoucher(@Param('id') id: string, @Body() updateDto: UpdateVoucherDto) {
    return this.vouchersService.updateVoucher(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteVoucher(@Param('id') id: string) {
    return this.vouchersService.deleteVoucher(id);
  }
}
