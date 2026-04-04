import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { NextFunction, Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import compression = require('compression');
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { TransformInterceptor } from './core/interceptors/transform.interceptor';

const DEFAULT_PORT = 3000;

/** Thư mục file upload — khớp URL `/uploads/...` và proxy Vite */
function ensureUploadsDirectory(): string {
  const dir = join(process.cwd(), 'uploads');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * COOP `unsafe-none` — giảm chặn postMessage / popup Google so với same-origin.
 * (Trang SPA tĩnh GitHub Pages vẫn có COOP riêng; header này áp lên response API.)
 * Không cache JSON dưới `/api`.
 */
function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const uploadsDir = ensureUploadsDirectory();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  /** Gzip — giảm ~70% payload JSON */
  app.use(compression());

  /** Render / reverse proxy — IP và HTTPS đúng khi cần */
  app.set('trust proxy', 1);

  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });
  app.use(securityHeadersMiddleware);

  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept',
      'X-Requested-With',
    ],
    credentials: false,
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      /** false: tránh 400 khi client gửi thêm field (extension, bản build cũ) — vẫn strip qua whitelist */
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.enableShutdownHooks();

  const port = Number(process.env.PORT) || DEFAULT_PORT;
  await app.listen(port);
  logger.log(`HTTP ${port} | uploads → ${uploadsDir}`);
}

bootstrap().catch((err: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(err instanceof Error ? (err.stack ?? err.message) : String(err));
  process.exit(1);
});
