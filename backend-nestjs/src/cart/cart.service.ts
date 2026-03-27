import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { CartRepository } from './cart.repository';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private cartRepository: CartRepository) {}

  async getMyCart(userId: string) {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }
    return cart;
  }

  async addToCart(userId: string, addDto: AddToCartDto) {
    let cart = await this.cartRepository.findByUserId(userId);
    if (!cart) {
      cart = await this.cartRepository.create(userId);
    }

    const itemIndex = cart.items.findIndex(
      (item: any) =>
        item.productId?._id?.toString() === addDto.productId ||
        item.productId?.toString() === addDto.productId,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += addDto.quantity;
    } else {
      cart.items.push({
        productId: new Types.ObjectId(addDto.productId),
        quantity: addDto.quantity,
      });
    }

    await this.cartRepository.save(cart);
    // Reload cart to get populated product data
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

    const itemIndex = cart.items.findIndex(
      (item: any) =>
        item.productId?._id?.toString() === productId ||
        item.productId?.toString() === productId,
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity = updateDto.quantity;
      await this.cartRepository.save(cart);
      return {
        message: 'Đã cập nhật số lượng',
        cart: await this.cartRepository.findByUserId(userId),
      };
    } else {
      throw new NotFoundException('Sản phẩm không có trong giỏ hàng');
    }
  }

  async removeCartItem(userId: string, productId: string) {
    const cart = await this.cartRepository.findByUserId(userId);
    if (!cart) throw new NotFoundException('Giỏ hàng trống');

    cart.items = cart.items.filter(
      (item: any) =>
        item.productId?._id?.toString() !== productId &&
        item.productId?.toString() !== productId,
    );
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
