import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Set global prefix
  app.setGlobalPrefix('api');

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
bootstrap();
