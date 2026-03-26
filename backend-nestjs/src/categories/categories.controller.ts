import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Get(':id')
  async getCategoryById(@Param('id') id: string) {
    return this.categoriesService.getCategoryById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createCategory(@Body() createDto: CreateCategoryDto) {
    return this.categoriesService.createCategory(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateCategory(@Param('id') id: string, @Body() updateDto: UpdateCategoryDto) {
    return this.categoriesService.updateCategory(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }
}
