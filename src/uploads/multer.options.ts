import { memoryStorage } from 'multer';

export const uploadsMulterOptions = {
  storage: memoryStorage(),
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
