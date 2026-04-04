import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  /** Biến thể (khi sản phẩm có variants) — trừ tồn theo dòng biến thể */
  @Prop({ type: Types.ObjectId })
  variantId?: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  /** Mã hiển thị — bắt buộc duy nhất (tránh E11000 khi index unique orderCode trên DB) */
  @Prop({ required: true, unique: true })
  orderCode: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ required: true })
  paymentMethod: string;

  @Prop({ default: 'Pending' }) // Pending, Paid, Failed
  paymentStatus: string;

  @Prop({ required: true })
  shippingAddress: string;

  /** Pending, AwaitingPayment (VNPay chưa trả), Processing, Shipped, Delivered, Cancelled */
  @Prop({ default: 'Pending' })
  orderStatus: string;

  @Prop()
  note?: string;

  @Prop()
  shippingMethod?: string;

  /** Mã giảm giá (mỗi user chỉ dùng 1 lần / mã — lưu khi đặt hàng có voucher) */
  @Prop()
  voucherCode?: string;

  @Prop()
  voucherDiscountAmount?: number;

  /** Sau khi VNPay IPN/return thành công */
  @Prop()
  vnpTransactionNo?: string;

  @Prop()
  vnpPayDate?: string;

  @Prop()
  vnpBankCode?: string;

  /** Đã trừ tồn kho khi tạo đơn — khi hủy đơn cần hoàn lại */
  @Prop({ default: false })
  inventoryDeducted?: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes để tăng tốc query
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'items.productId': 1 });
