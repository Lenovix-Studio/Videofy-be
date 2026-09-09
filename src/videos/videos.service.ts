import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

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
