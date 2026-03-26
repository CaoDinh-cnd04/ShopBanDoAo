import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Voucher, VoucherSchema } from './schemas/voucher.schema';
import { VoucherRepository } from './vouchers.repository';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Voucher.name, schema: VoucherSchema }])],
  controllers: [VouchersController],
  providers: [VoucherRepository, VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
