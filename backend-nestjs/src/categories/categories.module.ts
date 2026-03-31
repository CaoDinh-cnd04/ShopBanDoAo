import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './schemas/category.schema';
import { Brand, BrandSchema } from './schemas/brand.schema';
import { CategoryRepository } from './categories.repository';
import { BrandRepository } from './brands.repository';
import { CategoriesService } from './categories.service';
import {
  CategoriesController,
  SubCategoriesController,
  BrandsController,
} from './categories.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema },
    ]),
  ],
  controllers: [
    CategoriesController,
    SubCategoriesController,
    BrandsController,
  ],
  providers: [CategoryRepository, BrandRepository, CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
