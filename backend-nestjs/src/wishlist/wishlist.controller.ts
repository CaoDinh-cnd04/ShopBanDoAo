import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async getMyWishlist(@Request() req: any) {
    return this.wishlistService.getMyWishlist(req.user.userId);
  }

  @Post('toggle')
  async toggleWishlist(
    @Request() req: any,
    @Body() toggleDto: ToggleWishlistDto,
  ) {
    return this.wishlistService.toggleWishlist(req.user.userId, toggleDto);
  }
}
