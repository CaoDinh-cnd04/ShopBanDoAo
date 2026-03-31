import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CartRepository } from './cart.repository';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { ProductsService } from '../products/products.service';

@Injectable()
export class CartService {
  constructor(
    private cartRepository: CartRepository,
    private productsService: ProductsService,
  ) {}

  async getMyCart(userId: string) {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }
    return cart;
  }

  async addToCart(userId: string, addDto: AddToCartDto) {
    const product = await this.productsService.getProductById(addDto.productId);
    const p = product as any;
    const variants = Array.isArray(p.variants) ? p.variants : [];

    let variantIdObj: Types.ObjectId | undefined;
    let resolvedVariantId: string | undefined;

    if (variants.length > 0) {
      resolvedVariantId = addDto.variantId;
      if (!resolvedVariantId) {
        const first =
          variants.find(
            (x: any) => (x.stockQuantity ?? 0) >= addDto.quantity,
          ) ||
          variants.find((x: any) => (x.stockQuantity ?? 0) > 0) ||
          variants[0];
        if (!first) {
          throw new BadRequestException('Sản phẩm không còn biến thể');
        }
        resolvedVariantId = first._id.toString();
      }
      const v = variants.find(
        (x: any) => x._id?.toString() === resolvedVariantId,
      );
      if (!v) throw new BadRequestException('Biến thể không tồn tại');
      const stock = v.stockQuantity ?? 0;
      if (stock < addDto.quantity) {
        throw new BadRequestException('Không đủ hàng trong kho');
      }
      variantIdObj = new Types.ObjectId(resolvedVariantId);
    } else {
      const stock = p.stockQuantity ?? 0;
      if (stock < addDto.quantity) {
        throw new BadRequestException('Không đủ hàng trong kho');
      }
    }

    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    const itemIndex = cart.items.findIndex((item: any) => {
      const pid = item.productId?._id?.toString() || item.productId?.toString();
      const vid = item.variantId?.toString() || '';
      const dtoVid = resolvedVariantId || '';
      return pid === addDto.productId && vid === dtoVid;
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += addDto.quantity;
      await this.cartRepository.save(cart);
      return {
        message: 'Đã thêm vào giỏ hàng',
        cart: await this.cartRepository.findByUserId(userId),
      };
    }

    const newItem: any = {
      productId: new Types.ObjectId(addDto.productId),
      quantity: addDto.quantity,
    };
    if (variantIdObj) newItem.variantId = variantIdObj;

    cart.items.push(newItem);
    await this.cartRepository.save(cart);

    return {
      message: 'Đã thêm vào giỏ hàng',
      cart: await this.cartRepository.findByUserId(userId),
    };
  }

  async updateCartItem(
    userId: string,
    productId: string,
    updateDto: UpdateCartItemDto,
  ) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new NotFoundException('Giỏ hàng trống');

    const dtoVid = updateDto.variantId || '';
    const itemIndex = cart.items.findIndex((item: any) => {
      const pid = item.productId?._id?.toString() || item.productId?.toString();
      const vid = item.variantId?.toString() || '';
      return pid === productId && vid === dtoVid;
    });

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = updateDto.quantity;
      await this.cartRepository.save(cart);
      return {
        message: 'Đã cập nhật số lượng',
        cart: await this.cartRepository.findByUserId(userId),
      };
    }
    throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
  }

  async removeCartItem(userId: string, productId: string, variantId?: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new NotFoundException('Giỏ hàng trống');

    const dtoVid = variantId || '';
    cart.items = cart.items.filter((item: any) => {
      const pid = item.productId?._id?.toString() || item.productId?.toString();
      const vid = item.variantId?.toString() || '';
      return !(pid === productId && vid === dtoVid);
    });
    await this.cartRepository.save(cart);

    return {
      message: 'Đã xoá sản phẩm khỏi giỏ hàng',
      cart: await this.cartRepository.findByUserId(userId),
    };
  }

  async clearMyCart(userId: string) {
    await this.cartRepository.clearCart(userId);
    return { message: 'Đã làm sạch giỏ hàng' };
  }
}
