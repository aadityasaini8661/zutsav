const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../uploads', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
  });

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, webp) are allowed'));
  }
};

const csvFilter = (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() === '.csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'));
  }
};

const uploadProfile  = multer({ storage: createStorage('profiles'),  fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadGovtId   = multer({ storage: createStorage('govtids'),    fileFilter: imageFilter, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadProducts = multer({ storage: createStorage('products'),   fileFilter: imageFilter, limits: { fileSize: 5 * 1024 * 1024 } });
const uploadCSV      = multer({ storage: createStorage('csv'),        fileFilter: csvFilter,   limits: { fileSize: 5 * 1024 * 1024 } });

const uploadKYCDocs = multer({
  storage: createStorage('kycdocs'),
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'frontImage',   maxCount: 1 },
  { name: 'backImage',    maxCount: 1 },
  { name: 'selfieImage',  maxCount: 1 },
  { name: 'addressProof', maxCount: 1 },
]);

module.exports = { uploadProfile, uploadGovtId, uploadProducts, uploadCSV, uploadKYCDocs };
