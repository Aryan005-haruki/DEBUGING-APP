const express = require('express');
const multer = require('multer');
const path = require('path');
const apkController = require('../controllers/apkController');

const router = express.Router();

// Configure multer for APK file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'apk-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.apk') {
        cb(null, true);
    } else {
        cb(new Error('Only APK files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// POST /api/v1/analyze/apk
router.post('/', upload.single('file'), apkController.analyzeApk);

module.exports = router;
