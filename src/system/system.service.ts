import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { resetStorageFiles } from '../lib/helper';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resetSystem() {
    try {
      await this.resetDatabase();

      await resetStorageFiles();

      return {
        success: true,
        message: 'Database dan file fisik berhasil dibersihkan.',
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      this.logger.error(
        `Gagal melakukan reset sistem: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Gagal mereset database atau file fisik: ${error.message || ''}`,
      );
    }
  }

  private async resetDatabase() {
    await this.prisma.$transaction([
      this.prisma.favorite.deleteMany(),
      this.prisma.history.deleteMany(),
      this.prisma.videoTag.deleteMany(),
      this.prisma.video.deleteMany(),
      this.prisma.tag.deleteMany(),
    ]);

    this.logger.log('Seluruh tabel database berhasil dikosongkan.');
  }
}
