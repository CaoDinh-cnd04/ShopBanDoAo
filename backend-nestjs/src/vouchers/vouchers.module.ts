import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Voucher, VoucherSchema } from './schemas/voucher.schema';
import {
  VoucherUsage,
  VoucherUsageSchema,
} from './schemas/voucher-usage.schema';
import { VoucherRepository } from './vouchers.repository';
import { VoucherUsageRepository } from './voucher-usage.repository';
import { VouchersService } from './vouchers.service';
import {
  VouchersController,
  AdminVouchersController,
} from './vouchers.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Voucher.name, schema: VoucherSchema },
      { name: VoucherUsage.name, schema: VoucherUsageSchema },
    ]),
  ],
  controllers: [VouchersController, AdminVouchersController],
  providers: [VoucherRepository, VoucherUsageRepository, VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
