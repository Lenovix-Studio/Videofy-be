import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import * as path from 'path';
import * as fs from 'fs/promises';
import { PrismaService } from '../prisma/prisma.service';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);
  private readonly queue: Queue;

  constructor(private prisma: PrismaService) {
    this.queue = new Queue('video-processing', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    });
  }

  async enqueue(jobData: { videoId: string; inputPath: string }) {
    await this.queue.add('process', jobData);
  }

  async process(job: any) {
    const { videoId, inputPath } = job.data;
    const storageRoot = path.resolve(
      process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev',
    );
    const tempOutputPath = `${inputPath}.transcoded.mp4`;

    try {
      await this.prisma.video.update({
        where: { id: videoId },
        data: { transcodeStatus: 'PROCESSING' },
      });

      await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
          .outputOptions([
            '-c:v libx264',
            '-preset medium',
            '-crf 23',
            '-c:a aac',
            '-b:a 128k',
            '-movflags +faststart',
            '-vf scale=min(1920\\,iw):-2',
          ])
          .save(tempOutputPath)
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      await fs.unlink(inputPath);
      await fs.rename(tempOutputPath, inputPath);

      const relativeVideoPath = path
        .relative(storageRoot, inputPath)
        .replace(/\\/g, '/');

      await this.prisma.video.update({
        where: { id: videoId },
        data: {
          videoUrl: `/media/${relativeVideoPath}`,
          filePath: relativeVideoPath,
          fileName: path.basename(inputPath),
          mimeType: 'video/mp4',
          transcodeStatus: 'COMPLETED',
        },
      });

      this.logger.log(`Video ${videoId} berhasil ditranscode`);
    } catch (err: any) {
      this.logger.error(`Gagal mentranscode video ${videoId}: ${err.message}`);
      try {
        await fs.unlink(tempOutputPath);
      } catch {}
      await this.prisma.video.update({
        where: { id: videoId },
        data: { transcodeStatus: 'FAILED' },
      });
    }
  }
}
