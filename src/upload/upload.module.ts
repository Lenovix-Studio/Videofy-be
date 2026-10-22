import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { VideoProcessorService } from '../videos/video-processor.service';
import { VideoProcessorWorker } from '../videos/video-processor.worker';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [BullModule.registerQueue({ name: 'video-processing' })],
  controllers: [UploadController],
  providers: [UploadService, VideoProcessorService, VideoProcessorWorker],
  exports: [UploadService, VideoProcessorService],
})
export class UploadModule {}
