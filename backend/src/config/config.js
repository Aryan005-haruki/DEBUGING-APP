require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  apiKeys: {
    googlePageSpeed: process.env.GOOGLE_PAGESPEED_API_KEY
  },
  upload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['.apk']
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS || '*'
  },
  analysis: {
    timeoutMs: 120000, // 2 minutes
    maxConcurrent: 3
  }
};
