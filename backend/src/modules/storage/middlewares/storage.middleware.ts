import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadMiddlewareSingle = upload.single('file');
export const uploadMiddlewareArray = upload.array('file', 3);
