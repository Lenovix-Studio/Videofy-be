import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Absolute path folder based env
export const getStorageBasePath = (): string => {
  const relativePath =
    process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev';
  return path.resolve(process.cwd(), relativePath);
};

// Handle structure folder storage (YYYY/MM)
export const dynamicStorage = diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const category = file.fieldname === 'video' ? 'videos' : 'thumbnails';
    const targetDir = path.join(getStorageBasePath(), category, year, month);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `${uuidv4()}${ext}`;
    cb(null, fileName);
  },
});
