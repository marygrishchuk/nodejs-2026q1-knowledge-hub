import 'dotenv/config';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { AppLogger } from './common/logger/app-logger';

const shutdownLogger = new AppLogger('Shutdown');

const gracefulShutdown = async (
  app: INestApplication,
  reason: string,
): Promise<void> => {
  shutdownLogger.error(`Initiating graceful shutdown: ${reason}`);
  try {
    await app.close();
  } catch (closeError) {
    shutdownLogger.error(`Error during shutdown: ${closeError}`);
  }
  process.exit(1);
};

async function bootstrap() {
  const logger = new AppLogger('Bootstrap');
  const app = await NestFactory.create(AppModule, { logger });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('REST API for managing articles, categories, and comments')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('doc', app, document);

  process.on('uncaughtException', (error: Error) => {
    shutdownLogger.error(`uncaughtException: ${error.stack ?? error.message}`);
    gracefulShutdown(app, 'uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const message =
      reason instanceof Error
        ? (reason.stack ?? reason.message)
        : String(reason);
    shutdownLogger.error(`unhandledRejection: ${message}`);
    gracefulShutdown(app, 'unhandledRejection');
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
