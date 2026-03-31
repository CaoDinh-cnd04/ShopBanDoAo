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
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ─── Public ────────────────────────────────────────────────────────
  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  /** Distinct brand strings từ product (đặt trước :id) */
  @Get('brands')
  async getAllBrands(@Query('full') full?: string) {
    if (full === '1' || full === 'true') {
      return this.categoriesService.getAllBrands();
    }
    const brands = await this.categoriesService.getAllBrands();
    return brands.map((b: any) => b.brandName).filter(Boolean);
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  // ─── Admin: Category CRUD ──────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createCategory(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.updateCategory(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}

// ─── Sub-categories ──────────────────────────────────────────────────
@Controller('api/categories/sub')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class SubCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() dto: CreateSubCategoryDto) {
    return this.categoriesService.createSubCategory(dto);
  }

  @Put(':id')
  async update(@Param('id') subId: string, @Body() dto: UpdateSubCategoryDto) {
    return this.categoriesService.updateSubCategory(subId, dto);
  }

  @Delete(':id')
  async delete(
    @Param('id') subId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.categoriesService.deleteSubCategory(subId, categoryId);
  }
}

// ─── Brands ──────────────────────────────────────────────────────────
@Controller('api/brands')
export class BrandsController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAll() {
    return this.categoriesService.getAllBrands();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async create(@Body() dto: CreateBrandDto) {
    return this.categoriesService.createBrand(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.categoriesService.updateBrand(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async delete(@Param('id') id: string) {
    return this.categoriesService.deleteBrand(id);
  }
}
