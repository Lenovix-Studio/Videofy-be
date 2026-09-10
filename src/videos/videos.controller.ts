import {
  Controller,
  Get,
  Query,
  Post,
  ParseUUIDPipe,
  Param,
  Delete,
  StreamableFile,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  // Relate video
  @Get(':id/related')
  @ApiOperation({
    summary: 'Mendapatkan rekomendasi video selanjutnya (Personal)',
  })
  async getRelated(@Param('id') id: string, @Query('limit') limit?: number) {
    const maxResults = limit ? Number(limit) : 10;
    return this.videosService.getRelatedVideos(id, maxResults);
  }

  // Favorite video
  @Post(':id/favorite')
  @ApiOperation({
    summary: 'Toggle favorite status via Favorite table (POST/DELETE logic)',
  })
  async toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ isFavorite: boolean }> {
    return this.videosService.toggleFavorite(id);
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
