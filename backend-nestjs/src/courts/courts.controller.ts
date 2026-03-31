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
} from '@nestjs/common';
import { CourtsService } from './courts.service';
import {
  CreateCourtDto,
  UpdateCourtDto,
  QueryCourtDto,
  CreateCourtTypeDto,
  UpdateCourtTypeDto,
} from './dto/court.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  // ─── Court Types (public GET, admin write) ──────────────────────────
  /** Phải đặt trước :id để không bị bắt nhầm */
  @Get('types')
  async getAllCourtTypes() {
    return this.courtsService.getAllCourtTypes();
  }

  @Post('types')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createCourtType(@Body() dto: CreateCourtTypeDto) {
    return this.courtsService.createCourtType(dto);
  }

  @Put('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateCourtType(
    @Param('id') id: string,
    @Body() dto: UpdateCourtTypeDto,
  ) {
    return this.courtsService.updateCourtType(id, dto);
  }

  @Delete('types/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteCourtType(@Param('id') id: string) {
    return this.courtsService.deleteCourtType(id);
  }

  // ─── Courts ─────────────────────────────────────────────────────────
  @Get()
  async getAllCourts(@Query() queryDto: QueryCourtDto) {
    return this.courtsService.getAllCourts(queryDto);
  }

  @Get(':id')
  async getCourtById(@Param('id') id: string) {
    return this.courtsService.getCourtById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createCourt(@Body() createDto: CreateCourtDto) {
    return this.courtsService.createCourt(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateCourt(
    @Param('id') id: string,
    @Body() updateDto: UpdateCourtDto,
  ) {
    return this.courtsService.updateCourt(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteCourt(@Param('id') id: string) {
    return this.courtsService.deleteCourt(id);
  }
}

@Controller('api/admin/courts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class AdminCourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get('stats')
  async getCourtStats() {
    return this.courtsService.getCourtStats();
  }
}
