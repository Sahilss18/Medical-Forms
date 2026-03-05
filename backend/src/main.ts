import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from uploads directory
  const buildUploadsPath = join(__dirname, '..', 'uploads');
  const cwdUploadsPath = join(process.cwd(), 'uploads');
  const cwdBackendUploadsPath = join(process.cwd(), 'backend', 'uploads');

  app.useStaticAssets(buildUploadsPath, {
    prefix: '/uploads',
  });

  if (existsSync(cwdUploadsPath) && cwdUploadsPath !== buildUploadsPath) {
    app.useStaticAssets(cwdUploadsPath, {
      prefix: '/uploads',
    });
  }

  if (existsSync(cwdBackendUploadsPath) && cwdBackendUploadsPath !== buildUploadsPath) {
    app.useStaticAssets(cwdBackendUploadsPath, {
      prefix: '/uploads',
    });
  }
  
  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
