import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UploadModule } from './upload/upload.module.js';
import { SystemModule } from './system/system.module.js';
import { VideosModule } from './videos/videos.module.js';
import { TagsModule } from './tags/tags.module.js';
import { FavoriteModule } from './favorite/favorite.module.js';
import { HistoryModule } from './history/history.module.js';
import { PlaylistsModule } from './playlists/playlists.module.js';
import { CommentsModule } from './comments/comments.module.js';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    HistoryModule,
    PrismaModule,
    UploadModule,
    SystemModule,
    VideosModule,
    TagsModule,
    FavoriteModule,
    PlaylistsModule,
    CommentsModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
