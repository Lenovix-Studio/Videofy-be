import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { HistoryService } from './history.service';

@ApiTags('History')
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  // Get History data
  @Get()
  @ApiOperation({
    summary: 'Mengambil riwayat tontonan terkelompok berdasarkan waktu',
  })
  @ApiResponse({
    status: 200,
    description: 'Berhasil mengambil daftar riwayat',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Cari judul video',
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
    description: 'Jumlah data per halaman (default: 20)',
  })
  async getHistory(
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.historyService.getHistoryGrouped({ search, page, limit });
  }

  // Get last watched position for a video
  @Get('video/:videoId/position')
  @ApiOperation({ summary: 'Mengambil posisi terakhir ditonton video' })
  @ApiParam({ name: 'videoId', description: 'ID video' })
  async getLastPosition(@Param('videoId') videoId: string) {
    const position = await this.historyService.getLastPosition(videoId);
    return { videoId, position };
  }

  // Save watch position
  @Patch('video/:videoId/position')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menyimpan posisi terakhir ditonton video' })
  @ApiParam({ name: 'videoId', description: 'ID video' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        position: { type: 'number', example: 45 },
      },
      required: ['position'],
    },
  })
  async saveWatchPosition(
    @Param('videoId') videoId: string,
    @Body('position') position: number,
  ) {
    await this.historyService.saveWatchPosition(videoId, position);
    return { success: true };
  }

  // Delete video history
  @Delete('video/:videoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Menghapus video tertentu dari riwayat tontonan' })
  @ApiParam({
    name: 'videoId',
    description: 'ID dari video yang akan dihapus dari history',
  })
  @ApiResponse({ status: 204, description: 'Berhasil menghapus dari riwayat' })
  async removeHistory(@Param('videoId') videoId: string) {
    await this.historyService.removeByHistoryId(videoId);
  }

  // Delete all video history list
  @Delete('clear-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Menghapus seluruh riwayat tontonan' })
  @ApiResponse({ status: 200, description: 'Seluruh riwayat berhasil dihapus' })
  async clearAll() {
    await this.historyService.clearAll();
    return {
      statusCode: HttpStatus.OK,
      message: 'Seluruh riwayat tontonan berhasil dihapus',
    };
  }
}
