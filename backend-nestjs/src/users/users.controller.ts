import { Controller, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
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

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateDto);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
