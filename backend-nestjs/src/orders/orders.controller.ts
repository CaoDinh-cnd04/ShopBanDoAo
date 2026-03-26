import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, QueryOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // USER ROUTES
  @Post('orders')
  async createMyOrder(@Request() req: any, @Body() createDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.userId, createDto);
  }

  @Get('orders/my-orders')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  @Get('orders/:id')
  async getOrderById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, req.user.userId, req.user.role);
  }

  // ADMIN ROUTES
  @Get('admin/orders')
  @Roles('Admin')
  async getAllOrdersByAdmin(@Query() queryDto: QueryOrderDto) {
    return this.ordersService.getAllOrders(queryDto);
  }

  @Get('admin/orders/:id')
  @Roles('Admin')
  async getOrderByIdAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Put('admin/orders/:id/status')
  @Roles('Admin')
  async updateOrderStatusByAdmin(@Param('id') id: string, @Body() updateDto: UpdateOrderStatusDto) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }
}
