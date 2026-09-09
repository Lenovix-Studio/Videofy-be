import * as path from 'path';
import * as fs from 'fs/promises';
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);
  constructor(private readonly prisma: PrismaService) {}

  // Helper hapus file fisik dengan aman
  private async safeDeleteFile(relativePathFromDb: string | null) {
    if (!relativePathFromDb) return;

    try {
      const storageBasePath =
        process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';
      const absolutePath = path.isAbsolute(relativePathFromDb)
        ? relativePathFromDb
        : path.resolve(process.cwd(), storageBasePath, relativePathFromDb);

      await fs.unlink(absolutePath);
      this.logger.log(`Berhasil menghapus file fisik: ${absolutePath}`);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        this.logger.warn(
          `File tidak ditemukan saat akan dihapus: ${relativePathFromDb}`,
        );
      } else {
        this.logger.error(
          `Gagal menghapus file (${relativePathFromDb}): ${err.message}`,
        );
      }
    }
  }

  async deleteVideo(id: string): Promise<{ message: string }> {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Video dengan ID ${id} tidak ditemukan`);
    }

    await this.safeDeleteFile(video.filePath);
    await this.safeDeleteFile(video.thumbnailPath);

    await this.prisma.$transaction([
      this.prisma.videoTag.deleteMany({ where: { videoId: id } }),
      this.prisma.favorite.deleteMany({ where: { videoId: id } }),
      this.prisma.history.deleteMany({ where: { videoId: id } }),
      this.prisma.video.delete({ where: { id } }),
    ]);

    return { message: 'Video dan file fisik berhasil dihapus' };
  }

  async getVideoDetail(id: string): Promise<VideoDetailResponseDto> {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
        favorites: true,
      },
    });

    if (!video) {
      throw new NotFoundException(`Video dengan ID ${id} tidak ditemukan`);
    }

    await this.prisma.$transaction([
      this.prisma.video.update({
        where: { id },
        data: { views: { increment: 1 } },
      }),
      this.prisma.history.create({
        data: {
          videoId: id,
          watchedAt: new Date(),
        },
      }),
    ]);

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      filePath: video.filePath,
      thumbnailPath: video.thumbnailPath || '',
      fileName: video.fileName,
      duration: video.duration,
      size: Number(video.size),
      mimeType: video.mimeType,
      uploader: video.uploader,
      views: video.views + 1,
      source: video.source,
      createdAt: video.createdAt,
      updatedAt: video.updatedAt,
      isFavorite: video.isFavorite,
      tags: video.tags.map((vt) => ({
        id: vt.tag.id,
        name: vt.tag.name,
        slug: vt.tag.slug,
      })),
    };
  }

  async findAll(query: GetVideosQueryDto) {
    const requestedPage = Number(query.page) || 1;
    const page = requestedPage < 1 ? 1 : requestedPage;

    const limit = Number(query.limit) || 12;
    const skip = (page - 1) * limit;

    const [videos, totalItems] = await Promise.all([
      this.prisma.video.findMany({
        select: {
          id: true,
          title: true,
          videoUrl: true,
          thumbnailUrl: true,
          duration: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
      this.prisma.video.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: videos,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }
}
