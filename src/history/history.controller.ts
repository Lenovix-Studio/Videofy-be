import {
  Controller,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
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
