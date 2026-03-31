import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CategoryRepository } from './categories.repository';
import { BrandRepository } from './brands.repository';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateSubCategoryDto,
  UpdateSubCategoryDto,
  CreateBrandDto,
  UpdateBrandDto,
} from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private categoryRepository: CategoryRepository,
    private brandRepository: BrandRepository,
  ) {}

  // ─── Categories ────────────────────────────────────────────────────
  async getAllCategories() {
    return this.categoryRepository.findAll();
  }

  async getCategoryById(id: string) {
    const category = await this.categoryRepository.findById(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return category;
  }

  async createCategory(createDto: CreateCategoryDto) {
    const category = await this.categoryRepository.create(createDto);
    return { message: 'Tạo danh mục thành công', category };
  }

  async updateCategory(id: string, updateDto: UpdateCategoryDto) {
    const category = await this.categoryRepository.update(id, updateDto);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return { message: 'Cập nhật danh mục thành công', category };
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepository.softDelete(id);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục');
    return { message: 'Đã ẩn danh mục' };
  }

  // ─── Sub-categories ────────────────────────────────────────────────
  async createSubCategory(dto: CreateSubCategoryDto) {
    const { categoryId, ...rest } = dto;
    const category = await this.categoryRepository.findById(categoryId);
    if (!category) throw new NotFoundException('Không tìm thấy danh mục cha');
    const updated = await this.categoryRepository.addSubCategory(
      categoryId,
      rest,
    );
    return { message: 'Tạo danh mục con thành công', category: updated };
  }

  async updateSubCategory(subId: string, dto: UpdateSubCategoryDto) {
    const { categoryId, ...rest } = dto;
    if (!categoryId) {
      throw new BadRequestException(
        'Cần truyền categoryId để cập nhật danh mục con',
      );
    }
    const updated = await this.categoryRepository.updateSubCategory(
      categoryId,
      subId,
      rest,
    );
    if (!updated)
      throw new NotFoundException('Không tìm thấy danh mục hoặc danh mục con');
    return { message: 'Cập nhật danh mục con thành công', category: updated };
  }

  async deleteSubCategory(subId: string, categoryId?: string) {
    if (!categoryId) {
      const cats = await this.categoryRepository.findAll();
      const parent = cats.find((c) =>
        c.subCategories?.some((s) => (s as any)._id?.toString() === subId),
      );
      if (!parent) throw new NotFoundException('Không tìm thấy danh mục con');
      categoryId = parent._id.toString();
    }
    await this.categoryRepository.removeSubCategory(categoryId, subId);
    return { message: 'Đã xóa danh mục con' };
  }

  // ─── Brands ────────────────────────────────────────────────────────
  async getAllBrands() {
    return this.brandRepository.findAll();
  }

  async createBrand(dto: CreateBrandDto) {
    const brand = await this.brandRepository.create(dto);
    return { message: 'Tạo thương hiệu thành công', brand };
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    const brand = await this.brandRepository.update(id, dto);
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu');
    return { message: 'Cập nhật thương hiệu thành công', brand };
  }

  async deleteBrand(id: string) {
    const brand = await this.brandRepository.delete(id);
    if (!brand) throw new NotFoundException('Không tìm thấy thương hiệu');
    return { message: 'Đã xóa thương hiệu' };
  }
}
