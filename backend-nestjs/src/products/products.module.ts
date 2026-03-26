import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { ProductRepository } from './products.repository';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
  controllers: [ProductsController],
  providers: [ProductRepository, ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
