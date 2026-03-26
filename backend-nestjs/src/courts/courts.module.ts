import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Court, CourtSchema } from './schemas/court.schema';
import { CourtRepository } from './courts.repository';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Court.name, schema: CourtSchema }])],
  controllers: [CourtsController],
  providers: [CourtRepository, CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
