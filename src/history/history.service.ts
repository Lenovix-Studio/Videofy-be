import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoryService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: format duration in seconds to MM:SS
  private formatDuration(seconds: number): string {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  // Helper: group label based on date
  private getGroupLabel(date: Date): string {
    const now = new Date();
    const targetDate = new Date(date);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDay = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
    );

    const diffTime = today.getTime() - targetDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (diffDays === 0) return 'Hari Ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays <= 7) return '7 Hari Terakhir';
    if (diffDays <= 30) return 'Bulan Ini';

    return targetDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  async getHistoryGrouped(query: {
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = query.search || '';

    const whereCondition: any = search
      ? {
          video: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        }
      : {};

    const [histories, totalVideos] = await this.prisma.$transaction([
      this.prisma.history.findMany({
        where: whereCondition,
        include: { video: true },
        orderBy: { watchedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.history.count({ where: whereCondition }),
    ]);

    const groupsMap = new Map<string, any[]>();

    for (const item of histories) {
      const groupLabel = this.getGroupLabel(item.watchedAt);
      const videoData = {
        id: item.video.id,
        historyId: item.id,
        title: item.video.title,
        thumbnail: item.video.thumbnailUrl || item.video.thumbnailPath,
        duration:
          typeof item.video.duration === 'number'
            ? this.formatDuration(item.video.duration)
            : item.video.duration,
        watchedAt: new Date(item.watchedAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        lastPosition: item.lastPosition,
      };

      if (!groupsMap.has(groupLabel)) {
        groupsMap.set(groupLabel, []);
      }
      groupsMap.get(groupLabel)?.push(videoData);
    }

    const historyGroups = Array.from(groupsMap.entries()).map(
      ([group, videos]) => ({
        group,
        videos,
      }),
    );

    return {
      historyGroups,
      meta: {
        totalVideos,
        currentPage: page,
        totalPages: Math.ceil(totalVideos / limit),
        hasNextPage: page * limit < totalVideos,
      },
    };
  }

  async saveWatchPosition(videoId: string, position: number) {
    const latest = await this.prisma.history.findFirst({
      where: { videoId },
      orderBy: { watchedAt: 'desc' },
    });
    if (latest) {
      await this.prisma.history.update({
        where: { id: latest.id },
        data: { lastPosition: position, watchedAt: new Date() },
      });
    } else {
      await this.prisma.history.create({
        data: { videoId, lastPosition: position },
      });
    }
  }

  async getLastPosition(videoId: string): Promise<number> {
    const latest = await this.prisma.history.findFirst({
      where: { videoId },
      orderBy: { watchedAt: 'desc' },
      select: { lastPosition: true },
    });
    return latest?.lastPosition ?? 0;
  }

  async removeByHistoryId(historyId: string) {
    const history = await this.prisma.history.findUnique({
      where: { id: historyId },
    });
    if (!history) {
      throw new NotFoundException('Riwayat tidak ditemukan');
    }
    return this.prisma.history.delete({
      where: { id: historyId },
    });
  }

  async clearAll() {
    return this.prisma.history.deleteMany({});
  }
}
