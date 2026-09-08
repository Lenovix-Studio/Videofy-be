import { Controller, Get, Query } from '@nestjs/common';
import { VideosService } from './videos.service';
import { GetVideosQueryDto } from './dto/get-videos-query.dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get()
  async getVideos(@Query() query: GetVideosQueryDto) {
    return this.videosService.findAll(query);
  }
}
