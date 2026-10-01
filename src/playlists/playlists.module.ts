import { Module } from '@nestjs/common';
import { PlaylistsService } from './playlists.service.js';
import { PlaylistsController } from './playlists.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
