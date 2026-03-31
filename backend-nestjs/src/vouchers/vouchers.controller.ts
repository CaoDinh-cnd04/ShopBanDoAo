import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { VouchersService } from './vouchers.service';
import {
  CreateVoucherDto,
  UpdateVoucherDto,
  QueryVoucherDto,
  ApplyVoucherDto,
} from './dto/voucher.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // PUBLIC ROUTES — không cần đăng nhập
  @Get('public')
  async getPublicVouchers() {
    return this.vouchersService.getPublicVouchers();
  }

  // USER ROUTES — cần đăng nhập
  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyVoucher(
    @Body() dto: ApplyVoucherDto,
    @Req() req: Request & { user: { userId: string } },
  ) {
    return this.vouchersService.applyVoucher(
      dto.code,
      dto.orderValue,
      req.user.userId,
    );
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
  async updateVoucher(
    @Param('id') id: string,
    @Body() updateDto: UpdateVoucherDto,
  ) {
    return this.vouchersService.updateVoucher(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteVoucher(@Param('id') id: string) {
    return this.vouchersService.deleteVoucher(id);
  }
}

@Controller('api/admin/vouchers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminVouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Get('stats')
  async getVoucherStats() {
    return this.vouchersService.getVoucherStats();
  }
}
