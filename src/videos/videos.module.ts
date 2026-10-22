import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VideoProcessorService } from './video-processor.service';
import { VideoProcessorWorker } from './video-processor.worker';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: 'video-processing' }),
  ],
  controllers: [VideosController],
  providers: [VideosService, VideoProcessorService, VideoProcessorWorker],
  exports: [VideosService, VideoProcessorService],
})
export class VideosModule {}
