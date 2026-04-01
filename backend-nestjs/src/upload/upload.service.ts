import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Ảnh lưu file trên disk + đường dẫn trong DB.
 * Nếu set API_PUBLIC_URL (origin API, không có /api) → trả URL tuyệt đối https://.../uploads/...
 * để mọi máy / domain frontend đều tải được ảnh (tránh chỉ thấy khi dev localhost).
 */
@Injectable()
export class UploadService {
  constructor(private readonly config: ConfigService) {}

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

  uploadFile(file: any) {
    if (!file) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    const relative = `/uploads/${file.filename}`;
    return {
      message: 'Tải ảnh thành công',
      success: true,
      url: this.absoluteFileUrl(relative),
    };
  }

  uploadMultipleFiles(files: any[]) {
    if (!files || files.length === 0) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    const urls = files.map((file) =>
      this.absoluteFileUrl(`/uploads/${file.filename}`),
    );
    return {
      message: 'Tải các ảnh thành công',
      success: true,
      urls,
    };
  }
}
