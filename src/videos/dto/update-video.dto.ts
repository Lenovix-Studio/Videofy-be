import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdateVideoDto {
  @ApiPropertyOptional({
    description: 'Judul video',
    example: 'Tutorial NestJS & Next.js Terbaru',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Deskripsi video',
    example: 'Penjelasan lengkap mengenai pembuatan REST API dengan NestJS',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Sumber referensi atau link asal video',
    example: 'https://example.com/source',
  })
  @IsOptional()
  @ValidateIf((object, value) => value !== '')
  @IsUrl({}, { message: 'Source harus berupa URL yang valid' })
  source?: string;

  @ApiPropertyOptional({
    description: 'Tag dipisahkan dengan koma atau dikirim sebagai string',
    example: 'nestjs, typescript, backend',
  })
  @IsOptional()
  @IsString()
  tags?: string;
}
