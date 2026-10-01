import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return this.prisma.playlist.create({
      data: {
        title: data.title,
        description: data.description,
        slug,
        coverUrl: data.coverUrl,
      },
    });
  }

  async findAll() {
    return this.prisma.playlist.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { items: true },
        },
        items: {
          take: 4,
          orderBy: { addedAt: 'asc' },
          select: {
            id: true,
            videoId: true,
            type: true,
            video: { select: { thumbnailUrl: true } },
            photo: { select: { photoUrl: true } },
          },
        },
      },
    });
  }

  async findOneBySlug(slug: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            video: true,
            photo: true,
          },
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    return playlist;
  }

  async remove(id: string) {
    return this.prisma.playlist.delete({
      where: { id },
    });
  }

  async addItem(playlistId: string, data: any) {
    return this.prisma.playlistItem.create({
      data: {
        playlistId,
        type: data.type,
        videoId: data.type === 'video' ? data.videoId : null,
        photoId: data.type === 'photo' ? data.photoId : null,
      },
    });
  }

  async removeItem(playlistId: string, itemId: string) {
    const item = await this.prisma.playlistItem.findUnique({
      where: { id: itemId },
      include: { photo: true },
    });

    if (!item) {
      throw new NotFoundException('Playlist item not found');
    }

    if (item.type === 'photo' && item.photoId) {
      const { DeleteFile } = await import('../lib/helper.js');
      if (item.photo?.filePath) {
        await DeleteFile(item.photo.filePath);
      }

      return this.prisma.photo.delete({
        where: { id: item.photoId },
      });
    }

    return this.prisma.playlistItem.delete({
      where: { id: itemId },
    });
  }
}
