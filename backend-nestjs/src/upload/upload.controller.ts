import {
  BadRequestException,
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';
import type { Express } from 'express';
import type { MemoryUploadedFile } from './upload.service';

/** Một số trình duyệt gửi image/jpg thay vì image/jpeg */
const imageMime = /^image\/(jpe?g|png|gif|webp|svg\+xml)$/i;

const multerImageOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (
    req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!imageMime.test(file.mimetype)) {
      cb(
        new BadRequestException(
          'Chỉ chấp nhận ảnh (JPEG, PNG, GIF, WebP, SVG)',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};

@Controller('api/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', multerImageOptions))
  async uploadSingleFile(@UploadedFile() file: MemoryUploadedFile) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 20, multerImageOptions))
  async uploadMultipleFiles(@UploadedFiles() files: MemoryUploadedFile[]) {
    return this.uploadService.uploadMultipleFiles(files);
  }
}
