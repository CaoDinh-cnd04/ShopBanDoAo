import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { OrderRepository } from './orders.repository';
import { ProductRepository } from '../products/products.repository';

/**
 * Cron tasks cho đơn hàng:
 *  - Mỗi 15 phút: hủy đơn VNPay AwaitingPayment quá 30 phút và hoàn tồn kho.
 */
@Injectable()
export class OrderSchedulerService {
  private readonly logger = new Logger(OrderSchedulerService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async cancelAbandonedVnpayOrders(): Promise<void> {
    try {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 phút trước
      const abandoned = await this.orderModel
        .find({
          orderStatus: 'AwaitingPayment',
          paymentMethod: 'VNPAY',
          paymentStatus: { $ne: 'Paid' },
          createdAt: { $lte: cutoff },
        })
        .exec();

      if (abandoned.length === 0) return;

      let restored = 0;
      for (const order of abandoned) {
        try {
          await this.restoreInventory(order);
          await this.orderModel.updateOne(
            { _id: order._id },
            {
              $set: {
                orderStatus: 'Cancelled',
                inventoryDeducted: false,
                cancelReason: 'Hết thời gian thanh toán VNPay (tự động hủy)',
              },
            },
          );
          restored++;
        } catch (err) {
          this.logger.error(
            `cancelAbandonedVnpayOrders: lỗi đơn ${String(order._id)}: ${err instanceof Error ? err.message : err}`,
          );
        }
      }

      if (restored > 0) {
        this.logger.log(
          `cancelAbandonedVnpayOrders: hủy ${restored}/${abandoned.length} đơn VNPay chưa thanh toán, đã hoàn tồn kho`,
        );
      }
    } catch (err) {
      this.logger.error(
        `cancelAbandonedVnpayOrders error: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  /** Hoàn tồn kho từng dòng sản phẩm trong đơn (bỏ qua nếu đã hoàn rồi). */
  private async restoreInventory(order: OrderDocument): Promise<void> {
    const o = order as OrderDocument & {
      inventoryDeducted?: boolean;
      items?: { productId: unknown; variantId?: unknown; quantity?: number }[];
    };
    if (o.inventoryDeducted === false) return;
    const items = o.items || [];
    for (const it of items) {
      const q = Number(it.quantity) || 0;
      if (q < 1) continue;
      let pid = '';
      const rawPid = it.productId;
      if (rawPid instanceof Types.ObjectId) {
        pid = rawPid.toHexString();
      } else if (rawPid && typeof rawPid === 'object' && '_id' in (rawPid as object)) {
        pid = String((rawPid as { _id: unknown })._id);
      } else {
        pid = String(rawPid ?? '');
      }
      let vid: string | undefined;
      const rawVid = it.variantId;
      if (rawVid instanceof Types.ObjectId) {
        vid = rawVid.toHexString();
      } else if (rawVid != null && rawVid !== '') {
        vid = String(rawVid);
      }
      if (!pid) continue;
      await this.productRepository.incrementStockForLine(pid, vid, q);
    }
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.cancelAbandonedVnpayOrders().catch(() => null);
    this.logger.log('OrderScheduler: bootstrap sweep done');
  }
}
