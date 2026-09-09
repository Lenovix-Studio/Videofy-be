import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

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
