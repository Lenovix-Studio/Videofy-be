import * as path from 'path';
import { Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import * as fs from 'fs/promises';

const logger = new Logger('FFmpegUtils');

// Helper for delete file if error
export async function safeDeleteFile(filePath: string) {
  try {
    await fs.unlink(filePath);
    logger.log(`Berhasil menghapus file sementara akibat error: ${filePath}`);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      logger.error(`Gagal menghapus file ${filePath}: ${err.message}`);
    }
  }
}

// Helper generate thumbnail dari video
export function generateThumbnailFromVideo(
  videoPath: string,
  outputFolder: string,
  filename: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .screenshots({
        count: 1,
        timemarks: ['00:00:01.000'],
        folder: outputFolder,
        filename: filename,
      })
      .on('end', () => {
        const generatedPath = path.join(outputFolder, filename);
        resolve(generatedPath);
      })
      .on('error', (err) => {
        logger.error(`Gagal generate thumbnail dari video: ${err.message}`);
        reject(err);
      });
  });
}
