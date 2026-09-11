import { ApiProperty } from '@nestjs/swagger';

export class TagResponseDto {
  @ApiProperty({ example: 'uuid-atau-id-tag', description: 'ID unik dari tag' })
  id: string;

  @ApiProperty({ example: 'Teknologi', description: 'Nama tag' })
  name: string;

  @ApiProperty({ example: 'teknologi', description: 'Slug dari tag' })
  slug: string;

  @ApiProperty({
    example: 12,
    description: 'Jumlah video yang menggunakan tag ini',
  })
  count: number;
}
