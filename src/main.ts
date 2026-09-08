import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const storagePath = path.resolve(
    process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev',
  );
  app.useStaticAssets(storagePath, {
    prefix: '/media/',
  });

  const config = new DocumentBuilder()
    .setTitle('Videofy API')
    .setDescription('Dokumentasi REST API Videofy')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger UI available on: http://localhost:${port}/api/docs`);
}
bootstrap();
