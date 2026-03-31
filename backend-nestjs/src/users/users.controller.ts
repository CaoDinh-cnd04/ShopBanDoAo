import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';
import { QueryUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Admin')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getAllUsers(@Query() queryDto: QueryUserDto) {
    return this.usersService.getAllUsers(queryDto);
  }

  @Get('stats')
  async getUserStats() {
    return this.usersService.getUserStats();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateDto);
  }

  /** Xóa vĩnh viễn — DELETE /api/admin/users/permanent/:id */
  @Delete('permanent/:id')
  async permanentlyDeleteUser(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user?: { userId?: string } }).user;
    return this.usersService.permanentlyDeleteUser(id, user?.userId);
  }

  /** Alias: DELETE /api/admin/users/:id/permanent (bundle / proxy cũ) */
  @Delete(':id/permanent')
  async permanentlyDeleteUserLegacy(@Param('id') id: string, @Req() req: Request) {
    const user = (req as Request & { user?: { userId?: string } }).user;
    return this.usersService.permanentlyDeleteUser(id, user?.userId);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
