import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadsService {
  formatUploadedFiles(
    files: Express.Multer.File[],
    req?: Request,
  ): UploadResponseDto[] {
    const host = req ? `${req.protocol}://${req.get('host')}` : undefined;
    const fields = req?.body ?? {};
    return (files || []).map((f) => {
      const filename = f.filename ?? f.originalname;
      const path = f.path.replace(/\\/g, '/');
      const url = host ? `${host}/uploads/products/${filename}` : undefined;
      return {
        filename,
        path,
        mimetype: f.mimetype,
        size: f.size,
        url,
        fields,
      } as UploadResponseDto;
    });
  }
}
