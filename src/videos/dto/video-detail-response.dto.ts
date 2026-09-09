export class TagDto {
  id: string;
  name: string;
  slug: string;
}

export class VideoDetailResponseDto {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string;
  filePath: string;
  thumbnailPath: string;
  fileName: string;
  duration: number;
  size: number;
  mimeType: string;
  uploader: string;
  views: number;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  tags: TagDto[];
}
