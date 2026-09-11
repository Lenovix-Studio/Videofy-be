import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetFavoritesQueryDto {
  @ApiPropertyOptional({ description: 'Cari berdasarkan judul video' })
  @IsOptional({ message: 'Pencarian bersifat opsional' })
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Halaman ke berapa', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Jumlah data per halaman', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;
}
