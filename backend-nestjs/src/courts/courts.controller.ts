import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { CreateCourtDto, UpdateCourtDto, QueryCourtDto } from './dto/court.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  // PUBLIC ROUTES
  @Get()
  async getAllCourts(@Query() queryDto: QueryCourtDto) {
    return this.courtsService.getAllCourts(queryDto);
  }

  @Get(':id')
  async getCourtById(@Param('id') id: string) {
    return this.courtsService.getCourtById(id);
  }

  // ADMIN ROUTES
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createCourt(@Body() createDto: CreateCourtDto) {
    return this.courtsService.createCourt(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateCourt(@Param('id') id: string, @Body() updateDto: UpdateCourtDto) {
    return this.courtsService.updateCourt(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteCourt(@Param('id') id: string) {
    return this.courtsService.deleteCourt(id);
  }
}
