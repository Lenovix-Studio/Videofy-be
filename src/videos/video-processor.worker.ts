import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { VideoProcessorService } from './video-processor.service';

@Injectable()
@Processor('video-processing')
export class VideoProcessorWorker extends WorkerHost {
  constructor(private videoProcessor: VideoProcessorService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.videoProcessor.process(job);
  }
}
