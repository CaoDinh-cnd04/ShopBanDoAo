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
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/cart')
@UseGuards(JwtAuthGuard) // Chỉ User đăng nhập mới thao tác giỏ hàng
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getMyCart(@Request() req: any) {
    return this.cartService.getMyCart(req.user.userId);
  }

  @Post('items')
  async addToCart(@Request() req: any, @Body() addDto: AddToCartDto) {
    return this.cartService.addToCart(req.user.userId, addDto);
  }

  @Put('items/:productId')
  async updateCartItem(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() updateDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateCartItem(
      req.user.userId,
      productId,
      updateDto,
    );
  }

  @Delete('items/:productId')
  async removeCartItem(
    @Request() req: any,
    @Param('productId') productId: string,
    @Query('variantId') variantId?: string,
  ) {
    return this.cartService.removeCartItem(
      req.user.userId,
      productId,
      variantId,
    );
  }

  @Delete()
  async clearMyCart(@Request() req: any) {
    return this.cartService.clearMyCart(req.user.userId);
  }
}
