import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const storageRoot = path.resolve(
  process.env.STORAGE_RELATIVE_PATH || '../infra/storage/dev',
);

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

export const multerStorageConfig = diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const subFolder = file.fieldname === 'video' ? 'videos' : 'thumbnails';
    const targetDir = path.join(storageRoot, subFolder, year, month);

    ensureDir(targetDir);
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});
