import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname } from 'path';
import { randomBytes } from 'crypto';
import { v2 as cloudinary } from 'cloudinary';

/** File từ multer memoryStorage */
export interface MemoryUploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

/**
 * Upload ảnh:
 * - Nếu có CLOUDINARY_* → đẩy lên Cloudinary, trả `secure_url` (bền trên Render / redeploy).
 * - Không có → ghi `./uploads` + URL tương đối (dev); production nên cấu Cloudinary.
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private cloudinaryConfigured = false;

  constructor(private readonly config: ConfigService) {}

  private get cloudFolder(): string {
    return (
      this.config.get<string>('CLOUDINARY_FOLDER')?.trim() || 'shop-uploads'
    );
  }

  private ensureCloudinary(): boolean {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME')?.trim();
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY')?.trim();
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET')?.trim();
    if (!cloudName || !apiKey || !apiSecret) {
      return false;
    }
    if (!this.cloudinaryConfigured) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      this.cloudinaryConfigured = true;
    }
    return true;
  }

  /** Chuẩn /uploads/filename — nối API_PUBLIC_URL hoặc PUBLIC_URL nếu có */
  private absoluteFileUrl(relativePath: string): string {
    const rel = relativePath.startsWith('/')
      ? relativePath
      : `/${relativePath}`;
    const base =
      this.config.get<string>('API_PUBLIC_URL')?.trim() ||
      this.config.get<string>('PUBLIC_URL')?.trim();
    if (!base) return rel;
    const origin = base.replace(/\/+$/, '');
    return `${origin}${rel}`;
  }

  private async ensureUploadsDir(): Promise<void> {
    const dir = join(process.cwd(), 'uploads');
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  private async saveBufferToDisk(file: MemoryUploadedFile): Promise<string> {
    await this.ensureUploadsDir();
    const ext = extname(file.originalname) || '.jpg';
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    const dest = join(process.cwd(), 'uploads', name);
    await writeFile(dest, file.buffer);
    return this.absoluteFileUrl(`/uploads/${name}`);
  }

  private async uploadToCloudinary(file: MemoryUploadedFile): Promise<string> {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: this.cloudFolder,
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true,
    });
    return result.secure_url;
  }

  async uploadFile(file: MemoryUploadedFile | undefined) {
    if (!file?.buffer) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    try {
      if (this.ensureCloudinary()) {
        const url = await this.uploadToCloudinary(file);
        return {
          message: 'Tải ảnh thành công',
          success: true,
          url,
        };
      }
      const url = await this.saveBufferToDisk(file);
      return {
        message: 'Tải ảnh thành công',
        success: true,
        url,
      };
    } catch (e) {
      this.logger.error(
        `uploadFile: ${e instanceof Error ? e.message : String(e)}`,
      );
      return {
        message: 'Tải ảnh thất bại',
        success: false,
      };
    }
  }

  async uploadMultipleFiles(files: MemoryUploadedFile[] | undefined) {
    if (!files?.length) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    try {
      const urls: string[] = [];
      if (this.ensureCloudinary()) {
        for (const f of files) {
          if (f?.buffer) {
            urls.push(await this.uploadToCloudinary(f));
          }
        }
      } else {
        for (const f of files) {
          if (f?.buffer) {
            urls.push(await this.saveBufferToDisk(f));
          }
        }
      }
      if (urls.length === 0) {
        return { message: 'Không có file hợp lệ', success: false };
      }
      return {
        message: 'Tải các ảnh thành công',
        success: true,
        urls,
      };
    } catch (e) {
      this.logger.error(
        `uploadMultipleFiles: ${e instanceof Error ? e.message : String(e)}`,
      );
      return {
        message: 'Tải ảnh thất bại',
        success: false,
      };
    }
  }
}
