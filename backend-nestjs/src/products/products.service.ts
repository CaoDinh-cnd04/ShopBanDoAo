import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { ProductRepository } from './products.repository';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private productRepository: ProductRepository) {}

  async getAllProducts(query: QueryProductDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.search) {
      match.$or = [
        { productName: new RegExp(query.search, 'i') },
        { shortDescription: new RegExp(query.search, 'i') },
      ];
    }
    if (query.categoryId) match.categoryId = query.categoryId;
    if (query.isActive !== undefined) match.isActive = query.isActive === 'true';

    const [products, total] = await Promise.all([
      this.productRepository.findAll(match, skip, limit),
      this.productRepository.count(match),
    ]);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        limit,
      },
    };
  }

  async getProductById(id: string) {
    const product = await this.productRepository.findById(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return product;
  }

  async createProduct(createDto: CreateProductDto) {
    const payload = {
      ...createDto,
      categoryId: new Types.ObjectId(createDto.categoryId),
    } as any;
    const product = await this.productRepository.create(payload);
    return { message: 'Tạo sản phẩm thành công', product };
  }

  async updateProduct(id: string, updateDto: UpdateProductDto) {
    const payload: any = { ...updateDto };
    if (updateDto.categoryId) {
      payload.categoryId = new Types.ObjectId(updateDto.categoryId);
    }
    const product = await this.productRepository.update(id, payload);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { message: 'Cập nhật sản phẩm thành công', product };
  }

  async deleteProduct(id: string) {
    const product = await this.productRepository.softDelete(id);
    if (!product) throw new NotFoundException('Không tìm thấy sản phẩm');
    return { message: 'Xóa sản phẩm an toàn thành công' };
  }
}
