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
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  QueryOrderDto,
} from './dto/order.dto';
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
    return this.ordersService.createOrder(req.user.userId, createDto, req);
  }

  @Get('orders/my-orders')
  async getMyOrders(@Request() req: any) {
    return this.ordersService.getMyOrders(req.user.userId);
  }

  /** Alias — tránh một số proxy/client nhầm với orders/:id */
  @Put('orders/cancel/:id')
  async cancelMyOrderAlias(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelMyOrder(req.user.userId, id);
  }

  @Put('orders/:id/cancel')
  async cancelMyOrder(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.cancelMyOrder(req.user.userId, id);
  }

  /** Thanh toán lại VNPay (đơn chưa trả) */
  @Put('orders/:id/payment/vnpay')
  async retryVnpay(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getVnpayRetryUrl(req.user.userId, id, req);
  }

  /** Đổi sang COD khi VNPay chưa thành công */
  @Put('orders/:id/payment/cod')
  async switchToCod(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.switchUnpaidVnpayToCod(req.user.userId, id);
  }

  @Get('orders/:id')
  async getOrderById(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.getOrderById(id, req.user.userId, req.user.role);
  }

  // ADMIN ROUTES
  @Get('admin/orders/stats')
  @Roles('Admin')
  async getOrderStats(@Query() query: any) {
    return this.ordersService.getOrderStats(query);
  }

  @Get('admin/orders')
  @Roles('Admin')
  async getAllOrdersByAdmin(@Query() queryDto: QueryOrderDto) {
    return this.ordersService.getAllOrders(queryDto);
  }

  @Get('admin/orders/:id')
  @Roles('Admin')
  async getOrderByIdAdmin(@Param('id') id: string) {
    return this.ordersService.getOrderByIdForAdmin(id);
  }

  @Put('admin/orders/:id/status')
  @Roles('Admin')
  async updateOrderStatusByAdmin(
    @Param('id') id: string,
    @Body() updateDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateDto);
  }

  @Delete('admin/orders/:id')
  @Roles('Admin')
  async deleteOrderByAdmin(@Param('id') id: string) {
    return this.ordersService.deleteOrderByAdmin(id);
  }
}
