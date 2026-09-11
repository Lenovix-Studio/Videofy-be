import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getVideoDurationInSeconds } from 'get-video-duration';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from 'ffmpeg-static';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { generateThumbnailFromVideo, safeDeleteFile } from '../lib/helper';

if (ffmpegInstaller) {
  ffmpeg.setFfmpegPath(ffmpegInstaller);
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly storageRoot = path.resolve(
    process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev',
  );

  constructor(private prisma: PrismaService) {}

  async saveVideoMetadata(
    dto: UploadVideoDto,
    videoFile: Express.Multer.File,
    thumbnailFile?: Express.Multer.File,
  ) {
    if (!videoFile) {
      throw new BadRequestException('File video wajib diunggah.');
    }

    let generatedThumbFullPath: string | null = null;

    try {
      const relativeVideoPath = path
        .relative(this.storageRoot, videoFile.path)
        .replace(/\\/g, '/');

      let relativeThumbPath: string | null = null;

      if (thumbnailFile) {
        relativeThumbPath = path
          .relative(this.storageRoot, thumbnailFile.path)
          .replace(/\\/g, '/');
      } else {
        try {
          const now = new Date();
          const year = now.getFullYear().toString();
          const month = String(now.getMonth() + 1).padStart(2, '0');

          const thumbDir = path.join(
            this.storageRoot,
            'thumbnails',
            year,
            month,
          );
          await fs.mkdir(thumbDir, { recursive: true });

          const thumbFilename = `${path.parse(videoFile.filename).name}.jpg`;

          generatedThumbFullPath = await generateThumbnailFromVideo(
            videoFile.path,
            thumbDir,
            thumbFilename,
          );

          relativeThumbPath = path
            .relative(this.storageRoot, generatedThumbFullPath)
            .replace(/\\/g, '/');
        } catch (err: any) {
          this.logger.warn(
            `Lanjut tanpa thumbnail karena error pemrosesan: ${err.message}`,
          );
        }
      }

      let duration = 0;
      try {
        duration = Math.round(await getVideoDurationInSeconds(videoFile.path));
      } catch (err: any) {
        this.logger.warn(`Gagal mengekstrak durasi video: ${err.message}`);
      }

      let parsedTagIds: string[] = [];
      if (dto.tagIds) {
        if (Array.isArray(dto.tagIds)) {
          parsedTagIds = dto.tagIds.map((id) => String(id).trim());
        } else if (typeof dto.tagIds === 'string') {
          const trimmed = dto.tagIds.trim();
          if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
              parsedTagIds = JSON.parse(trimmed).map((id: any) =>
                String(id).trim(),
              );
            } catch {
              this.logger.warn('Format JSON tagIds tidak valid');
            }
          } else if (trimmed.length > 0) {
            parsedTagIds = trimmed.split(',').map((id) => id.trim());
          }
        }
      }

      const video = await this.prisma.$transaction(async (tx) => {
        const finalTagIds: string[] = [];

        if (parsedTagIds.length > 0) {
          for (const tagIdOrName of parsedTagIds) {
            let existingTag = await tx.tag.findFirst({
              where: {
                OR: [{ id: tagIdOrName }, { name: tagIdOrName }],
              },
            });

            if (!existingTag) {
              const uniqueSuffix = Math.random().toString(36).substring(2, 7);
              existingTag = await tx.tag.upsert({
                where: { name: tagIdOrName },
                update: {},
                create: {
                  name: tagIdOrName,
                  slug: `${tagIdOrName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uniqueSuffix}`,
                },
              });
            }

            finalTagIds.push(existingTag.id);
          }
        }

        return await tx.video.create({
          data: {
            title: dto.title,
            description: dto.description || '',
            source: dto.source || '',
            videoUrl: `/media/${relativeVideoPath}`,
            thumbnailUrl: relativeThumbPath
              ? `/media/${relativeThumbPath}`
              : null,
            filePath: relativeVideoPath,
            thumbnailPath: relativeThumbPath,
            fileName: videoFile.filename,
            duration,
            size: BigInt(videoFile.size),
            mimeType: videoFile.mimetype,
            uploader: dto.uploader || 'Admin',
            tags:
              finalTagIds.length > 0
                ? {
                    create: finalTagIds.map((tagId) => ({
                      tagId: tagId,
                    })),
                  }
                : undefined,
          },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });
      });

      return {
        ...video,
        size: video.size.toString(),
      };
    } catch (globalError: any) {
      this.logger.error(
        `Gagal memproses upload video secara keseluruhan: ${globalError.message}`,
      );

      if (videoFile && videoFile.path) {
        await safeDeleteFile(videoFile.path);
      }

      if (generatedThumbFullPath) {
        await safeDeleteFile(generatedThumbFullPath);
      }

      throw new InternalServerErrorException(
        `Gagal memproses unggahan video: ${globalError.message || 'Error tidak diketahui'}`,
      );
    }
  }
}
