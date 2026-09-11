import {
  Controller,
  Get,
  Query,
  ParseUUIDPipe,
  Param,
  Delete,
  StreamableFile,
  Put,
  UseInterceptors,
  Body,
  UploadedFiles,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { UpdateVideoDto } from './dto/update-video.dto';
import { dynamicStorage } from '../lib/storage';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Update video
  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui data video dan file (jika ada)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Tutorial NestJS Updated' },
        description: { type: 'string', example: 'Deskripsi baru' },
        source: { type: 'string', example: 'https://example.com' },
        tags: { type: 'string', example: 'nestjs, backend, typescript' },
        video: {
          type: 'string',
          format: 'binary',
          description: 'File video baru (opsional)',
        },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'File gambar thumbnail baru (opsional)',
        },
      },
    },
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      { storage: dynamicStorage },
    ),
  )
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVideoDto: UpdateVideoDto,
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
  ) {
    return this.videosService.update(id, updateVideoDto, files);
  }

  // Relate video
  @Get(':id/related')
  @ApiOperation({
    summary: 'Mendapatkan rekomendasi video selanjutnya (Personal)',
  })
  async getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    const maxResults = limit ? Number(limit) : 10;
    return this.videosService.getRelatedVideos(id, maxResults);
  }

  // Download video
  @Get(':id/download')
  @ApiOperation({ summary: 'Download Video file by ID' })
  async downloadVideo(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<StreamableFile> {
    return this.videosService.downloadVideo(id);
  }

  // DELETE video by ID
  @Delete(':id')
  @ApiOperation({
    summary: 'Menerima ID video dan menghapus video beserta file fisiknya',
  })
  async deleteVideo(@Param('id', ParseUUIDPipe) id: string) {
    return this.videosService.deleteVideo(id);
  }

  // GET video by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get Video by ID' })
  async getVideoDetail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VideoDetailResponseDto> {
    return this.videosService.getVideoDetail(id);
  }

  // GET video for homepage
  @Get()
  @ApiOperation({ summary: 'Get Video for homepage' })
  async getVideos(@Query() query: GetVideosQueryDto) {
    return this.videosService.findAll(query);
  }
}
