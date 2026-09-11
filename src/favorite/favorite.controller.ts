import {
  Controller,
  Get,
  Post,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { FavoriteService } from './favorite.service';
import { GetFavoritesQueryDto } from './dto/get-favorites-query.dto';

@ApiTags('Favorites')
@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  // get favorite video list
  @Get()
  @ApiOperation({
    summary:
      'Mengambil daftar video favorit dengan fitur pencarian dan pagination',
  })
  async findAll(@Query() query: GetFavoritesQueryDto) {
    return this.favoriteService.findAll(query);
  }

  // favorite/unfavorite video
  @Post(':id/favorite')
  @ApiOperation({
    summary: 'Toggle favorite status via Favorite table (POST/DELETE logic)',
  })
  async toggleFavorite(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ isFavorite: boolean }> {
    return this.favoriteService.toggleFavorite(id);
  }
}
