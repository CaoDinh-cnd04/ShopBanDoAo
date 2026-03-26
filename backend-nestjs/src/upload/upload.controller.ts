import { Controller, Post, UseInterceptors, UploadedFile, UploadedFiles, UseGuards } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

@Controller('api/upload')
@UseGuards(JwtAuthGuard) // Chỉ user đăng nhập mới được upload
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // Thư mục lưu ảnh trên server
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  uploadSingleFile(@UploadedFile() file: any) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 10, { // Max 10 files
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  uploadMultipleFiles(@UploadedFiles() files: any[]) {
    return this.uploadService.uploadMultipleFiles(files);
  }
}
