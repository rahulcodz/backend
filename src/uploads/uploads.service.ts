import { PutObjectCommand, S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { UploadResponseDto } from './dto/upload-response.dto';

@Injectable()
export class UploadsService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly keyPrefix: string;
  private readonly publicBaseUrl?: string;
  private readonly acl?: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') as string;
    if (!this.bucketName) {
      throw new Error('AWS_S3_BUCKET is not configured');
    }

    this.region = this.configService.get<string>('AWS_REGION') ?? 'us-east-1';
    this.keyPrefix =
      this.configService.get<string>('AWS_S3_UPLOAD_PREFIX') ??
      'uploads/products';
    this.publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_URL');
    this.acl = this.configService.get<string>('AWS_S3_ACL');

    const accessKeyId =
      this.configService.get<string>('AWS_ACCESS_KEY_ID') ??
      this.configService.get<string>('AWS_S3_ACCESS_KEY_ID');
    const secretAccessKey =
      this.configService.get<string>('AWS_SECRET_ACCESS_KEY') ??
      this.configService.get<string>('AWS_S3_SECRET_ACCESS_KEY');
    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    const forcePathStyle =
      this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') === 'true';

    const clientConfig: S3ClientConfig = {
      region: this.region,
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      if (forcePathStyle) {
        clientConfig.forcePathStyle = true;
      }
    }

    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async uploadFilesToS3(
    files: Express.Multer.File[],
    req?: Request,
  ): Promise<UploadResponseDto[]> {
    if (!files?.length) {
      return [];
    }

    const fields = req?.body ?? {};

    return Promise.all(
      files.map(async (file) => {
        if (!file.buffer) {
          throw new InternalServerErrorException(
            'File buffer missing from upload. Did you enable memory storage?',
          );
        }

        const key = this.buildObjectKey(file.originalname);
        try {
          await this.s3Client.send(
            new PutObjectCommand({
              Bucket: this.bucketName,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            }),
          );
        } catch (error) {
          debugger;
          throw new InternalServerErrorException(
            'Failed to upload image to S3',
          );
        }

        return {
          filename: file.originalname,
          path: key,
          mimetype: file.mimetype,
          size: file.size,
          url: this.buildFileUrl(key),
          fields,
        };
      }),
    );
  }

  private buildObjectKey(originalName: string): string {
    const safeExt = extname(originalName) || '.bin';
    return `${this.keyPrefix}/${Date.now()}-${randomUUID()}${safeExt}`;
  }

  private buildFileUrl(key: string): string | undefined {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    if (!this.bucketName || !this.region) {
      return undefined;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
