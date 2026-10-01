import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { PlaylistsService } from './playlists.service.js';

@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(@Body() createPlaylistDto: any) {
    return this.playlistsService.create(createPlaylistDto);
  }

  @Get()
  findAll() {
    return this.playlistsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.playlistsService.findOneBySlug(slug);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playlistsService.remove(id);
  }

  @Post(':playlistId/items')
  addItem(@Param('playlistId') playlistId: string, @Body() addItemDto: any) {
    return this.playlistsService.addItem(playlistId, addItemDto);
  }

  @Delete(':playlistId/items/:itemId')
  removeItem(
    @Param('playlistId') playlistId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.playlistsService.removeItem(playlistId, itemId);
  }
}
