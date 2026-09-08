import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { multerStorageConfig } from './storage.config.js';
import { UploadVideoDto } from './dto/upload-video.dto.js';
import { UploadService } from './upload.service.js';

@ApiTags('Videos')
@Controller('videos')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload video baru beserta thumbnail dan metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Video berhasil diunggah' })
  @ApiResponse({
    status: 400,
    description: 'Format file atau payload tidak valid',
  })
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
      ],
      {
        storage: multerStorageConfig,
        limits: { fileSize: 1000 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
          if (
            file.fieldname === 'video' &&
            !file.mimetype.startsWith('video/')
          ) {
            return cb(
              new BadRequestException('File harus berupa video!'),
              false,
            );
          }
          if (
            file.fieldname === 'thumbnail' &&
            !file.mimetype.startsWith('image/')
          ) {
            return cb(
              new BadRequestException('Thumbnail harus berupa gambar!'),
              false,
            );
          }
          cb(null, true);
        },
      },
    ),
  )
  async uploadVideo(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      thumbnail?: Express.Multer.File[];
    },
    @Body() dto: UploadVideoDto,
  ) {
    const videoFile = files?.video?.[0];
    const thumbnailFile = files?.thumbnail?.[0];

    if (!videoFile) {
      throw new BadRequestException('File video wajib diunggah!');
    }

    return this.uploadService.saveVideoMetadata(dto, videoFile, thumbnailFile);
  }
}
