import {
  Controller,
  Get,
  Query,
  ParseUUIDPipe,
  Param,
  Delete,
} from '@nestjs/common';
import { VideosService } from './videos.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';
import { VideoDetailResponseDto } from './dto/video-detail-response.dto';
import { ApiOperation } from '@nestjs/swagger';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

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
