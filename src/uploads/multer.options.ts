import { diskStorage } from 'multer';
import { extname, join } from 'path';
import * as fs from 'fs';

export const uploadsMulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = join(process.cwd(), 'uploads', 'products');
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
      } catch (err) {
        cb(err, uploadPath);
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
    // accept any image/*
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20,
  },
};
