import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './users.repository';
import { QueryUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(query: QueryUserDto) {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '20');
    const skip = (page - 1) * limit;

    const match: any = {};
    if (query.search) {
      match.$or = [
        { email: new RegExp(query.search, 'i') },
        { fullName: new RegExp(query.search, 'i') },
      ];
    }
    if (query.role) match.role = query.role;
    if (query.isActive !== undefined)
      match.isActive = query.isActive === 'true';

    const [users, total] = await Promise.all([
      this.userRepository.findAll(match, skip, limit),
      this.userRepository.count(match),
    ]);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
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
