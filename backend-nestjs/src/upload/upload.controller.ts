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
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../core/guards/roles.guard';
import { Roles } from '../core/decorators/roles.decorator';

/** Một số trình duyệt gửi image/jpg thay vì image/jpeg */
const imageMime = /^image\/(jpe?g|png|gif|webp|svg\+xml)$/i;

const multerImageOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname) || '.jpg';
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: any, file: any, cb: (error: Error | null, acceptFile: boolean) => void) => {
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
  uploadSingleFile(@UploadedFile() file: any) {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @Roles('Admin')
  @UseGuards(RolesGuard)
  @UseInterceptors(FilesInterceptor('files', 20, multerImageOptions))
  uploadMultipleFiles(@UploadedFiles() files: any[]) {
    return this.uploadService.uploadMultipleFiles(files);
  }
}
