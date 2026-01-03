const securityScannerService = require('../services/securityScannerService');
const cheerio = require('cheerio');
const axios = require('axios');

/**
 * PHASE 2: Security Controller
 * Handle security scan API requests
 */

/**
 * Run security scan on a website
 * POST /api/v1/security/scan
 */
exports.scanWebsite = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'URL is required'
            });
        }

        console.log(`🔒 Security scan requested for: ${url}`);

        // Fetch page content
        const response = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'HealthChecker-SecurityBot/1.0 (Security Analysis)'
            },
            maxRedirects: 5
        });

        const $ = cheerio.load(response.data);

        // Prepare page data
        const pageData = {
            html: response.data,
            headers: response.headers,
            resources: {
                js: [],
                css: [],
                images: []
            }
        };

        // Extract resources
        $('script[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) pageData.resources.js.push(src);
        });

        $('link[rel="stylesheet"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) pageData.resources.css.push(href);
        });

        // Run security scan
        const scanResults = await securityScannerService.scanWebsiteSecurity(url, pageData);

        res.json({
            status: 'success',
            data: scanResults
        });

    } catch (error) {
        console.error('Security scan error:', error);

        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(400).json({
                status: 'error',
                message: 'Unable to reach website. Please check the URL.',
                details: error.message
            });
        }

        res.status(500).json({
            status: 'error',
            message: 'Security scan failed',
            details: error.message
        });
    }
};

/**
 * Run quick security check
 * POST /api/v1/security/quick-scan
 */
exports.quickScan = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                status: 'error',
                message: 'URL is required'
            });
        }

        // Fetch page
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'HealthChecker-SecurityBot/1.0'
            }
        });

        const pageData = {
            html: response.data,
            headers: response.headers
        };

        // Quick scan
        const scanResults = await securityScannerService.quickSecurityScan(url, pageData);

        res.json({
            status: 'success',
            data: scanResults
        });

    } catch (error) {
        console.error('Quick scan error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Quick security scan failed',
            details: error.message
        });
    }
};

module.exports = exports;
