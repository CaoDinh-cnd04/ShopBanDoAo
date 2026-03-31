import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  /** Ảnh upload: URL `/uploads/...` — khớp proxy Vite & URL lưu trong DB */
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  // NOTE: Global prefix đã bỏ vì mỗi @Controller đã khai báo 'api/...' sẵn rồi
  // Nếu giữ setGlobalPrefix('api') thì route sẽ thành /api/api/xxx -> 404

  // Enable CORS
  app.enableCors();

  // Enable Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Loại bỏ các key không có trong class DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu gửi lên key lạ
      transform: true, // Tự động cast kiểu dữ liệu
    }),
  );

  // Enable Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
