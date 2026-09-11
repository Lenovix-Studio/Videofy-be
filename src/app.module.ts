import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UploadModule } from './upload/upload.module.js';
import { SystemModule } from './system/system.module.js';
import { VideosModule } from './videos/videos.module.js';
import { TagsModule } from './tags/tags.module.js';

@Module({
  imports: [PrismaModule, UploadModule, SystemModule, VideosModule, TagsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
