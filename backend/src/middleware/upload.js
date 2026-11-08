import multer from 'multer';

// Configure RAM-based memory storage
const storage = multer.memoryStorage();

// File filter for KYC documents (images & PDFs)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Only JPEG, PNG, WEBP, and PDF files are allowed.`), false);
  }
};

// 5MB limit
const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB
};

export const upload = multer({
  storage,
  limits,
  fileFilter,
});

export default upload;
