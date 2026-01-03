const express = require('express');
const websiteController = require('../controllers/websiteController');

const router = express.Router();

// POST /api/v1/analyze/website
router.post('/', websiteController.analyzeWebsite);

module.exports = router;
