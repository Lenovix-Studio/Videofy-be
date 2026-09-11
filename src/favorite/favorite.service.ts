import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetFavoritesQueryDto } from './dto/get-favorites-query.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FavoriteService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetFavoritesQueryDto) {
    const { search, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;
    const whereCondition: Prisma.FavoriteWhereInput = search
      ? {
          video: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        }
      : {};

    const [totalItems, favorites] = await this.prisma.$transaction([
      this.prisma.favorite.count({ where: whereCondition }),
      this.prisma.favorite.findMany({
        where: whereCondition,
        include: {
          video: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: skip,
        take: limit,
      }),
    ]);

    const data = favorites.map((fav) => ({
      id: fav.video.id,
      title: fav.video.title,
      thumbnail: fav.video.thumbnailUrl,
      duration: fav.video.duration,
      date: fav.video.createdAt.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    }));

    return {
      data,
      meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async toggleFavorite(videoId: string): Promise<{ isFavorite: boolean }> {
    const videoExists = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!videoExists) {
      throw new NotFoundException('Video tidak ditemukan');
    }

    const existingFavorite = await this.prisma.favorite.findFirst({
      where: { videoId },
    });

    if (existingFavorite) {
      await this.prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });

      await this.prisma.video.update({
        where: { id: videoId },
        data: { isFavorite: false },
      });

      return { isFavorite: false };
    } else {
      await this.prisma.favorite.create({
        data: { videoId },
      });

      await this.prisma.video.update({
        where: { id: videoId },
        data: { isFavorite: true },
      });

      return { isFavorite: true };
    }
  }
}
