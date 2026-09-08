import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SystemService } from './system.service';

@ApiTags('System')
@Controller('system')
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset database dan hapus seluruh file fisik di storage',
  })
  @ApiResponse({ status: 200, description: 'Sistem berhasil di-reset.' })
  async reset() {
    return await this.systemService.resetSystem();
  }
}
