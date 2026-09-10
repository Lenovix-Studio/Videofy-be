import * as path from 'path';
import * as fs from 'fs/promises';
import { Logger } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
const logger = new Logger('FFmpegUtils');

// Delete file
export async function DeleteFile(relativePathFromDb: string | null) {
  if (!relativePathFromDb) return;

  try {
    const storageBasePath =
      process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';
    const absolutePath = path.isAbsolute(relativePathFromDb)
      ? relativePathFromDb
      : path.resolve(process.cwd(), storageBasePath, relativePathFromDb);

    await fs.unlink(absolutePath);
    logger.log(`Berhasil menghapus file fisik: ${absolutePath}`);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      logger.warn(
        `File tidak ditemukan saat akan dihapus: ${relativePathFromDb}`,
      );
    } else {
      logger.error(
        `Gagal menghapus file (${relativePathFromDb}): ${err.message}`,
      );
    }
  }
}

// Delete file if error
export async function safeDeleteFile(filePath: string | null) {
  try {
    await fs.unlink(filePath ?? '');
    logger.log(`Berhasil menghapus file sementara akibat error: ${filePath}`);
  } catch (err: any) {
    if (err.code !== 'ENOENT') {
      logger.error(`Gagal menghapus file ${filePath}: ${err.message}`);
    }
  }
}

// Generate thumbnail dari video
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

// Delete All file (thumnail and video)
export async function resetStorageFiles() {
  const relativeStoragePath =
    process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';
  const storageDir = path.resolve(process.cwd(), relativeStoragePath);

  try {
    await fs.access(storageDir);

    const files = await fs.readdir(storageDir);

    for (const file of files) {
      const filePath = path.join(storageDir, file);
      await fs.rm(filePath, { recursive: true, force: true });
    }

    await fs.mkdir(path.join(storageDir, 'thumbnails'), { recursive: true });

    await fs.mkdir(path.join(storageDir, 'videos'), { recursive: true });

    logger.log(
      `Storage di ${storageDir} berhasil dibersihkan dan diinisialisasi ulang.`,
    );
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(storageDir, { recursive: true });
      await fs.mkdir(path.join(storageDir, 'thumbnails'), {
        recursive: true,
      });

      logger.log(
        `Folder storage tidak ditemukan, membuat baru terstruktur di ${storageDir}.`,
      );
    } else {
      throw error;
    }
  }
}
