import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentResponseDto } from './dto/comment-response.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('videos/:videoId')
  async create(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    return this.commentsService.create(videoId, createCommentDto);
  }

  @Get('videos/:videoId')
  async findByVideoId(
    @Param('videoId', ParseUUIDPipe) videoId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<CommentResponseDto[]> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.commentsService.findByVideoId(videoId, pageNum, limitNum);
  }

  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commentsService.delete(id);
  }
}
