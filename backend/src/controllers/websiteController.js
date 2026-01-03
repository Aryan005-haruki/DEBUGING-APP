const pagespeedService = require('../services/pagespeedService');
const linkCheckerService = require('../services/linkCheckerService');
// TEMP: Disabled for debugging
// const securityScannerService = require('../services/securityScannerService');
const reportGenerator = require('../services/reportGeneratorService');
const cheerio = require('cheerio');
const axios = require('axios');

exports.analyzeWebsite = async (req, res) => {
    try {
        console.log(`📥 Received request:`, {
            body: req.body,
            headers: req.headers['content-type']
        });

        const { url } = req.body;

        // Validate URL
        if (!url) {
            console.log('❌ Validation failed: URL is missing');
            return res.status(400).json({
                status: 'error',
                message: 'URL is required'
            });
        }

        console.log(`🔍 Validating URL: "${url}"`);

        // Simplified URL validation - more permissive for modern TLDs
        // Just check if it has basic structure and domain
        const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*)?$/i;
        if (!urlPattern.test(url)) {
            console.log(`❌ Validation failed: Invalid URL format - "${url}"`);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid URL format. Please enter a valid website URL (e.g., https://example.com)'
            });
        }

        console.log(`📊 Analyzing website: ${url}`);

        // Fetch page content for security analysis
        let pageData = null;
        let securityData = null;

        try {
            const pageResponse = await axios.get(url, {
                timeout: 15000,
                headers: { 'User-Agent': 'HealthChecker-Bot/1.0' }
            });

            const $ = cheerio.load(pageResponse.data);

            pageData = {
                html: pageResponse.data,
                headers: pageResponse.headers,
                resources: {
                    js: [],
                    css: []
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

            console.log('📄 Page content fetched for security analysis');
        } catch (error) {
            console.warn('⚠️ Unable to fetch page content:', error.message);
        }

        // Run analyses in parallel (including security scan)
        const analysisPromises = [
            pagespeedService.analyze(url),
            linkCheckerService.analyze(url)
        ];

        // Add security scan if page data available
        if (pageData) {
            analysisPromises.push(securityScannerService.scanWebsiteSecurity(url, pageData));
        }

        const results = await Promise.allSettled(analysisPromises);

        // Extract results (even if some failed)
        const combinedResults = {
            pagespeed: results[0].status === 'fulfilled' ? results[0].value : null,
            brokenLinks: results[1].status === 'fulfilled' ? results[1].value : null,
            // TEMP: Disabled for debugging
            security: null, // results[2] && results[2].status === 'fulfilled' ? results[2].value : null,
            lighthouse: null
        };

        console.log('📝 Analysis Results:', {
            pagespeedSuccess: !!combinedResults.pagespeed,
            brokenLinksSuccess: !!combinedResults.brokenLinks,
            securitySuccess: !!combinedResults.security
        });

        // Generate final report
        const report = reportGenerator.generateWebsiteReport(url, combinedResults);

        console.log(`✅ Analysis complete for: ${url}`);
        console.log(`📊 Report Summary: ${report.summary.critical} Critical, ${report.summary.warning} Warnings, ${report.summary.passed} Passed`);

        res.json({
            status: 'success',
            data: report
        });

    } catch (error) {
        console.error('❌ Website analysis error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze website',
            details: error.message
        });
    }
};
