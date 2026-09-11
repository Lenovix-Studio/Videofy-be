import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto/tag-response.dto';

@ApiTags('Tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  // get list video based selected tag
  @Get('videos')
  @ApiOperation({
    summary: 'Mengambil daftar video berdasarkan filter tag dengan pagination',
  })
  @ApiQuery({
    name: 'tagId',
    required: false,
    type: String,
    description: 'UUID dari Tag',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Halaman ke-berapa (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah data per halaman (default: 12)',
  })
  async findVideosByTag(
    @Query('tagId') tagId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : 1;
    const parsedLimit = limit ? parseInt(limit, 10) : 12;
    return this.tagsService.findVideosByTag(tagId, parsedPage, parsedLimit);
  }

  // get list tag
  @Get()
  @ApiOperation({ summary: 'Mengambil daftar tag terpopuler' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Jumlah tag yang ingin diambil (default: 20)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Cari tag berdasarkan nama',
  })
  @ApiResponse({ status: 200, type: TagResponseDto, isArray: true })
  async getTags(
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<TagResponseDto[]> {
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    return this.tagsService.findAllWithCount(parsedLimit, search);
  }
}
