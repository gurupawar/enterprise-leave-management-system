const express = require('express');
const multer = require('multer');
const {
  getFiles,
  uploadFile,
  downloadFile,
  deleteFile
} = require('../controllers/fileController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

router.get('/', auth, getFiles);
router.post('/upload', auth, upload.single('file'), uploadFile);
router.get('/download/:id', auth, downloadFile);
router.delete('/:id', auth, authorize('ADMIN', 'HR'), deleteFile);

module.exports = router;