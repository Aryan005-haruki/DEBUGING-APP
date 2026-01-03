const express = require('express');
const crawlerController = require('../controllers/crawlerController');

const router = express.Router();

// POST /api/v1/crawl/start - Start a new crawl
router.post('/start', crawlerController.startCrawl);

// GET /api/v1/crawl/:crawlId - Get crawl result by ID
router.get('/:crawlId', crawlerController.getCrawl);

// GET /api/v1/crawl/history - Get crawl history for a website
router.get('/history', crawlerController.getCrawlHistory);

// GET /api/v1/crawl/stats - Get storage statistics
router.get('/stats', crawlerController.getStats);

module.exports = router;
