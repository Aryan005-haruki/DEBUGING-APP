const express = require('express');
const securityController = require('../controllers/securityController');

const router = express.Router();

// POST /api/v1/security/scan - Full security audit
router.post('/scan', securityController.scanWebsite);

// POST /api/v1/security/quick-scan - Quick security check
router.post('/quick-scan', securityController.quickScan);

module.exports = router;
