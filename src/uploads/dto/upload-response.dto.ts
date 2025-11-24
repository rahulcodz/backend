export class UploadResponseDto {
  filename!: string;
  path!: string; // local server path
  mimetype!: string;
  size!: number;
  url?: string; // public URL if static serving configured
  fields?: Record<string, any>; // any form fields sent with the upload
}
