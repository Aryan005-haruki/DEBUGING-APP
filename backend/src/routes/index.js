const express = require('express');
const websiteRoutes = require('./website');
const apkRoutes = require('./apk');
const crawlerRoutes = require('./crawler');
const securityRoutes = require('./security');

const router = express.Router();

// Mount routes
router.use('/analyze/website', websiteRoutes);
router.use('/analyze/apk', apkRoutes);
router.use('/crawl', crawlerRoutes);
router.use('/security', securityRoutes);

module.exports = router;
