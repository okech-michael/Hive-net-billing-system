import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const { DATABASE_URL, JWT_SECRET, WEB_ORIGIN } = process.env;
  const port = Number(process.env.API_PORT ?? 4000);
  if (!DATABASE_URL || !/^postgres(?:ql)?:\/\//.test(DATABASE_URL)) {
    throw new Error('DATABASE_URL must be a PostgreSQL connection URL');
  }
  if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.toLowerCase().includes('replace-with')) {
    throw new Error('JWT_SECRET must be replaced with at least 32 random characters');
  }
  if (!WEB_ORIGIN?.trim()) throw new Error('WEB_ORIGIN must allow the frontend origin');
  if (!Number.isInteger(port) || port < 1 || port > 65_535) throw new Error('API_PORT must be a valid TCP port');
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use(helmet());
  app.enableCors({ origin: WEB_ORIGIN.split(',').map((origin) => origin.trim()), credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
