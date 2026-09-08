import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);

  constructor(private readonly prisma: PrismaService) {}

  async resetSystem() {
    try {
      await this.resetDatabase();

      await this.resetStorageFiles();

      return {
        success: true,
        message: 'Database dan file fisik berhasil dibersihkan.',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Gagal melakukan reset sistem', error);
      throw new InternalServerErrorException(
        'Gagal mereset database atau file fisik.',
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

  private async resetStorageFiles() {
    const relativeStoragePath =
      process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';
    const storageDir = path.resolve(process.cwd(), relativeStoragePath);

    try {
      await fs.access(storageDir);

      const files = await fs.readdir(storageDir);

      for (const file of files) {
        const filePath = path.join(storageDir, file);
        await fs.rm(filePath, { recursive: true, force: true });
      }

      this.logger.log(`Storage di ${storageDir} berhasil dibersihkan.`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(storageDir, { recursive: true });
        this.logger.log(
          `Folder storage tidak ditemukan, membuat baru di ${storageDir}.`,
        );
      } else {
        throw error;
      }
    }
  }
}
