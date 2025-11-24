export class UploadResponseDto {
  filename!: string;
  path!: string; // S3 object key
  mimetype!: string;
  size!: number;
  url?: string; // public URL if static serving configured
  fields?: Record<string, any>; // any form fields sent with the upload
}
