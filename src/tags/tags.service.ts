import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TagResponseDto } from './dto/tag-response.dto';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findVideosByTag(tagId?: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const whereCondition =
      !tagId || tagId === 'all'
        ? {}
        : {
            tags: {
              some: {
                tagId: tagId,
              },
            },
          };

    const [totalItems, videos] = await Promise.all([
      this.prisma.video.count({ where: whereCondition }),
      this.prisma.video.findMany({
        where: whereCondition,
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data: videos,
      meta: {
        totalItems,
        itemCount: videos.length,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
      },
    };
  }

  async findAllWithCount(
    limit: number = 20,
    search?: string,
  ): Promise<TagResponseDto[]> {
    const tags = await this.prisma.tag.findMany({
      take: limit,
      where: search
        ? {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: { videos: true },
        },
      },
      orderBy: {
        videos: {
          _count: 'desc',
        },
      },
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: tag._count.videos,
    }));
  }
}
