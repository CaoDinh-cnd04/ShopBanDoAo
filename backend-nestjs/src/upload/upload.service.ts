import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  uploadFile(file: any) {
    if (!file) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    // file.path sẽ là đường dẫn lưu file trên disk
    return {
      message: 'Tải ảnh thành công',
      success: true,
      url: `/uploads/${file.filename}`,
    };
  }

  uploadMultipleFiles(files: any[]) {
    if (!files || files.length === 0) {
      return { message: 'Không có file nào được tải lên!', success: false };
    }
    const urls = files.map((file) => `/uploads/${file.filename}`);
    return {
      message: 'Tải các ảnh thành công',
      success: true,
      urls,
    };
  }
}
