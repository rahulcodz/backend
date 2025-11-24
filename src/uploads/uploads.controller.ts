import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Req,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';
import {
  ApiTags,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UploadResponseDto } from './dto/upload-response.dto';
import { UploadsService } from './uploads.service';
import { uploadsMulterOptions } from './multer.options';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @ApiOperation({ summary: 'Upload multiple images with form-data fields' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: {
          type: 'string',
          description: 'Optional product id to associate with these images',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['images'],
    },
  })
  @UseInterceptors(FilesInterceptor('images', 20, uploadsMulterOptions))
  @ApiResponse({
    status: 201,
    description: 'Files uploaded',
    type: [UploadResponseDto],
  })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req,
  ): Promise<UploadResponseDto[]> {
    if (!files || files.length === 0) {
      throw new HttpException('No files uploaded', HttpStatus.BAD_REQUEST);
    }

    // delegate formatting / url construction to service
    const responses = this.uploadsService.formatUploadedFiles(files, req);
    return responses;
  }
}
