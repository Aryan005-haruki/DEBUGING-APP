const crawlerService = require('../services/crawlerService');
const pageAnalyzerService = require('../services/pageAnalyzerService');
const storageService = require('../services/storageService');

/**
 * PHASE 1: Crawler Controller
 * Handle crawling API requests
 */

/**
 * Crawl a website
 * POST /api/v1/crawl/start
 */
exports.startCrawl = async (req, res) => {
    try {
        const { url, maxDepth, maxPages, screenshotEnabled } = req.body;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'URL is required'
            });
        }

        console.log(`🚀 Starting crawl for: ${url}`);

        // Configure crawler
        const options = {
            maxDepth: maxDepth || 5,
            maxPages: maxPages || 100,
            screenshotEnabled: screenshotEnabled !== false,
            headless: true
        };

        // Initialize storage
        await storageService.init();

        // Start crawling
        const crawlResult = await crawlerService.crawlWebsite(url, options);

        // Save to storage
        const saved = await storageService.saveCrawl(crawlResult);

        console.log(`✅ Crawl completed: ${crawlResult.totalPages} pages`);

        res.json({
            status: 'success',
            data: {
                ...crawlResult,
                storage: saved
            }
        });

    } catch (error) {
        console.error('Crawl error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to crawl website',
            details: error.message
        });
    }
};

/**
 * Get crawl result by ID
 * GET /api/v1/crawl/:crawlId
 */
exports.getCrawl = async (req, res) => {
    try {
        const { crawlId } = req.params;

        await storageService.init();
        const crawl = await storageService.getCrawl(crawlId);

        if (!crawl) {
            return res.status(404).json({
                status: 'error',
                message: 'Crawl not found'
            });
        }

        res.json({
            status: 'success',
            data: crawl
        });

    } catch (error) {
        console.error('Get crawl error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve crawl',
            details: error.message
        });
    }
};

/**
 * Get recent crawls for a website
 * GET /api/v1/crawl/history?url=https://example.com
 */
exports.getCrawlHistory = async (req, res) => {
    try {
        const { url, limit } = req.query;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'URL parameter is required'
            });
        }

        await storageService.init();
        const crawls = await storageService.getRecentCrawls(url, parseInt(limit) || 10);

        res.json({
            status: 'success',
            data: {
                website: url,
                count: crawls.length,
                crawls: crawls.map(c => ({
                    crawlId: c.crawlId,
                    crawledAt: c.crawledAt,
                    totalPages: c.totalPages,
                    duration: c.duration
                }))
            }
        });

    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to retrieve crawl history',
            details: error.message
        });
    }
};

/**
 * Get storage statistics
 * GET /api/v1/crawl/stats
 */
exports.getStats = async (req, res) => {
    try {
        await storageService.init();
        const stats = await storageService.getStats();

        res.json({
            status: 'success',
            data: stats
        });

    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to get statistics',
            details: error.message
        });
    }
};

module.exports = exports;
