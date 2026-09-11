import * as fs from 'fs';
import * as path from 'path';
import {
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';
import {
  DeleteFile,
  formatDate,
  formatDuration,
  formatVideoResponse,
  safeDeleteFile,
  slugify,
} from '../lib/helper';
import { UpdateVideoDto } from './dto/update-video.dto';
import { getStorageBasePath } from '../lib/storage';

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  async update(
    id: string,
    updateVideoDto: UpdateVideoDto,
    files?: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    const existingVideo = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      throw new NotFoundException(`Video dengan ID ${id} tidak ditemukan.`);
    }

    let tagsList: string[] | undefined = undefined;
    if (updateVideoDto.tags !== undefined) {
      tagsList = updateVideoDto.tags
        ? updateVideoDto.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
    }

    const updateData: any = {
      ...(updateVideoDto.title && { title: updateVideoDto.title }),
      ...(updateVideoDto.description !== undefined && {
        description: updateVideoDto.description,
      }),
      ...(updateVideoDto.source !== undefined && {
        source: updateVideoDto.source,
      }),
    };

    if (tagsList !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tagsList.map((tagName) => {
          const slug = slugify(tagName);
          return {
            tag: {
              connectOrCreate: {
                where: { name: tagName },
                create: {
                  name: tagName,
                  slug: slug,
                },
              },
            },
          };
        }),
      };
    }

    if (files?.video && files.video.length > 0) {
      const videoFile = files.video[0];

      const relativeVideoPath = path
        .relative(getStorageBasePath(), videoFile.path)
        .replace(/\\/g, '/');

      updateData.videoUrl = `/media/${relativeVideoPath}`;
      updateData.filePath = `/${relativeVideoPath}`;
      updateData.fileName = videoFile.filename;
      updateData.size = BigInt(videoFile.size);
      updateData.mimeType = videoFile.mimetype;

      await safeDeleteFile(existingVideo.filePath);
    }

    if (files?.thumbnail && files.thumbnail.length > 0) {
      const thumbFile = files.thumbnail[0];

      const relativeThumbPath = path
        .relative(getStorageBasePath(), thumbFile.path)
        .replace(/\\/g, '/');

      updateData.thumbnailUrl = `/media/${relativeThumbPath}`;
      updateData.thumbnailPath = `/${relativeThumbPath}`;

      await safeDeleteFile(existingVideo.thumbnailPath);
    }

    const updatedVideo = await this.prisma.video.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    return formatVideoResponse(updatedVideo);
  }

  async getRelatedVideos(videoId: string, limit = 10) {
    const currentVideo = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!currentVideo) {
      throw new NotFoundException('Video tidak ditemukan');
    }

    const relatedVideos = await this.prisma.$queryRaw<any[]>`
      SELECT 
        v.id,
        v.title,
        v."thumbnailUrl",
        v.duration,
        v."createdAt",
        v.views,
        COUNT(vt_other."tagId")::int AS "sharedTagsCount",
        -- Cek apakah video ini sudah pernah Anda tonton
        CASE 
          WHEN EXISTS (SELECT 1 FROM public."History" h WHERE h."videoId" = v.id) THEN 1 
          ELSE 0 
        END AS "isWatched",
        -- Cek apakah video ini termasuk favorit Anda
        CASE 
          WHEN EXISTS (SELECT 1 FROM public."Favorite" f WHERE f."videoId" = v.id) THEN 1 
          ELSE 0 
        END AS "isFavoriteVideo"
      FROM public."Video" v
      -- Ambil tag dari video yang sedang ditonton
      LEFT JOIN public."VideoTag" vt_current ON vt_current."videoId" = ${videoId}
      -- Hubungkan dengan video lain yang punya tag sama
      LEFT JOIN public."VideoTag" vt_other ON vt_other."tagId" = vt_current."tagId" AND vt_other."videoId" = v.id
      WHERE v.id != ${videoId}
      GROUP BY v.id
      ORDER BY 
        "isWatched" ASC,            -- 1. Utamakan yang BELUM ditonton (0 akan di atas 1)
        "sharedTagsCount" DESC,     -- 2. Utamakan yang tag-nya paling mirip
        "isFavoriteVideo" DESC,     -- 3. Utamakan yang Anda favoritkan
        v.views DESC                -- 4. Utamakan yang views-nya paling banyak
      LIMIT ${limit};
    `;

    return relatedVideos.map((video) => ({
      id: video.id,
      title: video.title,
      thumbnail: video.thumbnailUrl || '/placeholder-thumbnail.jpg',
      duration: formatDuration(video.duration),
      date: formatDate(video.createdAt),
    }));
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

  async downloadVideo(id: string): Promise<StreamableFile> {
    const storageRelativePath =
      process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';

    const storageRoot = path.resolve(process.cwd(), storageRelativePath);

    const video = await this.prisma.video.findUnique({
      where: { id },
      select: {
        title: true,
        filePath: true,
        fileName: true,
        mimeType: true,
        size: true,
      },
    });

    if (!video || !video.filePath) {
      throw new NotFoundException(
        'Video tidak ditemukan atau data file tidak lengkap',
      );
    }

    const absoluteFilePath = path.join(storageRoot, video.filePath);

    Logger.log(`[Download] Membaca file dari path: ${absoluteFilePath}`);

    if (!fs.existsSync(absoluteFilePath)) {
      throw new NotFoundException(
        'File fisik video tidak ditemukan di storage server',
      );
    }

    const downloadName = video.fileName || `${video.title || 'video'}.mp4`;

    const fileStream = fs.createReadStream(absoluteFilePath);

    return new StreamableFile(fileStream, {
      type: video.mimeType || 'video/mp4',
      disposition: `attachment; filename="${encodeURIComponent(downloadName)}"`,
      length: video.size ? Number(video.size) : undefined,
    });
  }

  async deleteVideo(id: string): Promise<{ message: string }> {
    const video = await this.prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      throw new NotFoundException(`Video dengan ID ${id} tidak ditemukan`);
    }

    await DeleteFile(video.filePath);
    await DeleteFile(video.thumbnailPath);

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
