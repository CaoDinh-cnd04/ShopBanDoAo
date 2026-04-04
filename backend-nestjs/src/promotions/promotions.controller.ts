import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/promotions')
export class PromotionsController {
  constructor(private readonly service: PromotionsService) {}

  /** Công khai — trả về tất cả chương trình đang active */
  @Get('active')
  getActive() {
    return this.service.findActive();
  }

  /** Công khai — active theo danh mục */
  @Get('active/category/:categoryId')
  getActiveForCategory(@Param('categoryId') categoryId: string) {
    return this.service.findActiveForCategory(categoryId);
  }

  /** Admin — danh sách tất cả */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  findAll() {
    return this.service.findAll();
  }

  /** Admin — tạo mới */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  create(@Body() dto: CreatePromotionDto) {
    return this.service.create(dto);
  }

  /** Admin — cập nhật */
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.service.update(id, dto);
  }

  /** Admin — xoá */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  remove(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
