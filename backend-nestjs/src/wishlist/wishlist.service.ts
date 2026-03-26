import { Injectable } from '@nestjs/common';
import { WishlistRepository } from './wishlist.repository';
import { ToggleWishlistDto } from './dto/wishlist.dto';

@Injectable()
export class WishlistService {
  constructor(private wishlistRepository: WishlistRepository) {}

  async getMyWishlist(userId: string) {
    const wishlist = await this.wishlistRepository.findAllByUser(userId);
    return { wishlist };
  }

  async toggleWishlist(userId: string, toggleDto: ToggleWishlistDto) {
    const existing = await this.wishlistRepository.findByUserAndProduct(userId, toggleDto.productId);
    
    if (existing) {
      await this.wishlistRepository.delete(existing._id.toString());
      return { message: 'Đã xoá khỏi danh sách yêu thích', isAdded: false };
    } else {
      const wishlist = await this.wishlistRepository.create(userId, toggleDto.productId);
      return { message: 'Đã thêm vào danh sách yêu thích', isAdded: true, wishlist };
    }
  }
}
