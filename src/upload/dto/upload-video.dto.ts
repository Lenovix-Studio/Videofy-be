import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UploadVideoDto {
  @ApiProperty({ description: 'Judul video', example: 'Tutorial NestJS & Bun' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Deskripsi video' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Nama uploader', example: 'Ichsanul' })
  @IsString()
  @IsOptional()
  uploader?: string;

  @ApiPropertyOptional({
    description: 'Array of Tag IDs (format JSON string)',
    example: '["tag-uuid-1", "tag-uuid-2"]',
  })
  @IsOptional()
  tagIds?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'File video (mp4, mkv, dll)',
  })
  video: any;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'File thumbnail (jpg, png)',
  })
  thumbnail?: any;
}
