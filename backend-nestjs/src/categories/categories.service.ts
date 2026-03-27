import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoryRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private categoryRepository: CategoryRepository) {}

  async getAllCategories() {
    const categories = await this.categoryRepository.findAll();
    return categories; // Trả về array trực tiếp, không wrap { categories: [...] }
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async createCategory(createDto: CreateCategoryDto) {
    const category = await this.categoryRepository.create(createDto);
    return category;
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.update(id, updateDto);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.softDelete(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return { message: 'Đã xoá danh mục' };
  }
}
