import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
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
 * COOP/CORP cho OAuth popup; không cache response JSON dưới `/api`.
 * Controllers đã dùng prefix `api/...` — không dùng setGlobalPrefix('api') để tránh /api/api.
 */
function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
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
      forbidNonWhitelisted: true,
      transform: true,
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
