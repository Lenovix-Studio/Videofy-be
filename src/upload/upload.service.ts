import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { getVideoDurationInSeconds } from 'get-video-duration';
import { PrismaService } from '../prisma/prisma.service';
import { UploadVideoDto } from './dto/upload-video.dto';

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
    const relativeVideoPath = path
      .relative(this.storageRoot, videoFile.path)
      .replace(/\\/g, '/');

    const relativeThumbPath = thumbnailFile
      ? path.relative(this.storageRoot, thumbnailFile.path).replace(/\\/g, '/')
      : null;

    let duration = 0;
    try {
      duration = Math.round(await getVideoDurationInSeconds(videoFile.path));
    } catch (err: any) {
      this.logger.warn(`Gagal mengekstrak durasi video: ${err.message}`);
    }

    let parsedTagIds: string[] = [];
    if (dto.tagIds) {
      if (Array.isArray(dto.tagIds)) {
        parsedTagIds = dto.tagIds;
      } else if (typeof dto.tagIds === 'string') {
        const trimmed = dto.tagIds.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
          try {
            parsedTagIds = JSON.parse(trimmed);
          } catch {
            this.logger.warn('Format JSON tagIds tidak valid');
          }
        } else if (trimmed.length > 0) {
          parsedTagIds = trimmed.split(',').map((id) => id.trim());
        }
      }
    }

    const video = await this.prisma.$transaction(async (tx) => {
      if (parsedTagIds.length > 0) {
        for (const tagIdOrName of parsedTagIds) {
          const existingTag = await tx.tag.findUnique({
            where: { id: tagIdOrName },
          });

          if (!existingTag) {
            const uniqueSuffix = Math.random().toString(36).substring(2, 7);
            await tx.tag.create({
              data: {
                id: tagIdOrName,
                name: `Tag-${uniqueSuffix}`,
                slug: `tag-${uniqueSuffix}-${Date.now()}`,
              },
            });
          }
        }
      }

      return await tx.video.create({
        data: {
          title: dto.title,
          description: dto.description || '',
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
            parsedTagIds.length > 0
              ? {
                  create: parsedTagIds.map((tagId) => ({
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
  }
}
