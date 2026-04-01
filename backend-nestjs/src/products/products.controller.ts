import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductDto,
} from './dto/product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /** Danh sách thương hiệu có trong DB — đặt trước :id */
  @Get('meta/brands')
  async getDistinctBrands() {
    return this.productsService.getDistinctBrands();
  }

  /** Trang chủ — SP bán chạy (theo tổng quantity trong đơn); đặt trước :id */
  @Get('featured/top-selling')
  @UseGuards(OptionalJwtAuthGuard)
  async getTopSelling(@Query('limit') limit?: string) {
    const n = parseInt(limit || '8', 10);
    return this.productsService.getTopSellingProducts(
      Number.isFinite(n) && n > 0 ? n : 8,
    );
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getAllProducts(
    @Request() req: { user?: { role?: string } },
    @Query() queryDto: QueryProductDto,
  ) {
    return this.productsService.getAllProducts(queryDto, req.user ?? null);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getProductById(
    @Request() req: { user?: { role?: string } },
    @Param('id') id: string,
  ) {
    return this.productsService.getProductById(id, req.user ?? null);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async createProduct(@Body() createDto: CreateProductDto) {
    return this.productsService.createProduct(createDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin')
  async deleteProduct(@Param('id') id: string) {
    return this.productsService.deleteProduct(id);
  }
}
