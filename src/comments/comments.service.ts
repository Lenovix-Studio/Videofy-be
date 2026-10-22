import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    videoId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const videoExists = await this.prisma.video.findUnique({
      where: { id: videoId },
    });
    if (!videoExists) {
      throw new NotFoundException(`Video dengan ID ${videoId} tidak ditemukan`);
    }

    return await this.prisma.comment.create({
      data: {
        videoId,
        content: createCommentDto.content,
      },
    });
  }

  async findByVideoId(
    videoId: string,
    page: number,
    limit: number,
  ): Promise<CommentResponseDto[]> {
    return await this.prisma.comment.findMany({
      where: { videoId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
  }

  async delete(id: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      throw new NotFoundException(`Komentar dengan ID ${id} tidak ditemukan`);
    }
    await this.prisma.comment.delete({ where: { id } });
  }
}
