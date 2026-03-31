import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './users.repository';
import { QueryUserDto, UpdateUserDto } from './dto/user.dto';

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(query: QueryUserDto) {
    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(query.limit || '20', 10) || 20),
    );
    const skip = (page - 1) * limit;

    const match: Record<string, unknown> = {};
    const q = query.search?.trim();
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      match.$or = [{ email: rx }, { fullName: rx }, { phone: rx }];
    }
    if (query.role?.trim()) match.role = query.role.trim();
    /** Chuỗi rỗng không được coi là filter (tránh isActive: false cho mọi đơn) */
    if (query.isActive !== undefined && query.isActive !== '') {
      match.isActive = query.isActive === 'true';
    }

    const [users, total] = await Promise.all([
      this.userRepository.findAll(match, skip, limit),
      this.userRepository.count(match),
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
        totalUsers: total,
        totalItems: total,
        limit,
      },
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }

  async updateUser(id: string, updateDto: UpdateUserDto) {
    const user = await this.userRepository.update(id, updateDto);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user; // Sẽ được interceptor map thêm message 'Thành công'
  }

  async deleteUser(id: string) {
    const user = await this.userRepository.softDelete(id);
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return { message: 'Xóa an toàn thành công' };
  }

  /** Xóa bản ghi user khỏi DB (không thể hoàn tác). */
  async permanentlyDeleteUser(id: string, currentUserId?: string) {
    if (currentUserId && id === currentUserId) {
      throw new ForbiddenException(
        'Không thể xóa vĩnh viễn chính tài khoản đang đăng nhập',
      );
    }
    const existing = await this.userRepository.findById(id);
    if (!existing) throw new NotFoundException('Không tìm thấy người dùng');
    if (existing.role === 'Admin') {
      const adminCount = await this.userRepository.count({ role: 'Admin' });
      if (adminCount <= 1) {
        throw new BadRequestException(
          'Không thể xóa tài khoản admin cuối cùng',
        );
      }
    }
    const removed = await this.userRepository.permanentDelete(id);
    if (!removed) throw new NotFoundException('Không tìm thấy người dùng');
    return { message: 'Đã xóa người dùng vĩnh viễn' };
  }

  async getUserStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [totalUsers, newUsersThisMonth, adminCount, activeUsers] =
      await Promise.all([
        this.userRepository.count({}),
        this.userRepository.count({ createdAt: { $gte: startOfMonth } }),
        this.userRepository.count({ role: 'Admin' }),
        this.userRepository.count({ isActive: true }),
      ]);
    return { totalUsers, newUsersThisMonth, adminCount, activeUsers };
  }
}
