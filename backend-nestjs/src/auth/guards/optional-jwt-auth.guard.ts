import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Có Bearer JWT thì gắn req.user; không có / lỗi thì bỏ qua (không 401).
 * Dùng cho GET sản phẩm: cửa hàng chỉ thấy SP đang bán; admin đăng nhập thấy cả SP ẩn.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      return true;
    }
  }

  handleRequest<TUser = any>(err: any, user: TUser): TUser | null {
    if (err || !user) return null;
    return user;
  }
}
