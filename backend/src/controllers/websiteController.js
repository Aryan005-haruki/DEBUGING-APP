const pagespeedService = require('../services/pagespeedService');
const linkCheckerService = require('../services/linkCheckerService');
const reportGenerator = require('../services/reportGeneratorService');
const securityScannerService = require('../services/securityScannerService');
const seoScannerService = require('../services/seoScannerService');
const accessibilityScannerService = require('../services/accessibilityScannerService');
const codeQualityScannerService = require('../services/codeQualityScannerService');

// ── New Phase 6 services ──
const dnsAuditService = require('../services/dnsAuditService');
const techDetectorService = require('../services/techDetectorService');
const domainIntelService = require('../services/domainIntelService');
const networkWaterfallService = require('../services/networkWaterfallService');
const redirectAnalyzerService = require('../services/redirectAnalyzerService');
const cookieAuditService = require('../services/cookieAuditService');
const mobileFriendlinessService = require('../services/mobileFriendlinessService');
const mixedContentService = require('../services/mixedContentService');
const blacklistCheckService = require('../services/blacklistCheckService');

// ── New Phase 7 services ──
const robotsSitemapService = require('../services/robotsSitemapService');
const socialPreviewService = require('../services/socialPreviewService');
const imageOptimizationService = require('../services/imageOptimizationService');
const uptimeService = require('../services/uptimeService');
const legalComplianceService = require('../services/legalComplianceService');
const structuredDataService = require('../services/structuredDataService');
const brokenImageService = require('../services/brokenImageService');

const axios = require('axios');

exports.analyzeWebsite = async (req, res) => {
    try {
        console.log(`📥 Received request:`, {
            body: req.body,
            headers: req.headers['content-type']
        });

        const { url } = req.body;

        if (!url) {
            console.log('❌ Validation failed: URL is missing');
            return res.status(400).json({ status: 'error', message: 'URL is required' });
        }

        console.log(`🔍 Validating URL: "${url}"`);

        const urlPattern = /^(https?:\/\/)?([\w\-]+(\.[\w\-]+)+)([\w\-\.,@?^=%&:/~\+#]*)?$/i;
        if (!urlPattern.test(url)) {
            console.log(`❌ Validation failed: Invalid URL format - "${url}"`);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid URL format. Please enter a valid website URL (e.g., https://example.com)'
            });
        }

        console.log(`📊 Analyzing website: ${url}`);

        // ── Step 1: Fetch page ONCE and reuse for all HTML-based scanners ──
        let pageData = null;
        try {
            const response = await axios.get(url, {
                timeout: 15000,
                headers: { 'User-Agent': 'HealthChecker-Bot/2.0' },
                maxRedirects: 5
            });
            pageData = {
                html: response.data,
                headers: response.headers,
                resources: extractResources(response.data, url)
            };
        } catch (err) {
            console.log('⚠️ Page fetch failed:', err.message);
            pageData = { html: '', headers: {}, resources: { js: [], css: [], images: [] } };
        }

        // ── Step 2: Run ALL scanners in parallel ──
        const analysisPromises = [
            // Existing (indices 0-5)
            safe(() => pagespeedService.analyze(url)),                                    // 0
            safe(() => linkCheckerService.analyze(url)),                                  // 1
            safe(() => securityScannerService.quickSecurityScan(url, pageData)),           // 2
            safe(() => seoScannerService.analyzeSEO(url, pageData)),                      // 3
            safe(() => accessibilityScannerService.analyzeAccessibility(url, pageData)),   // 4
            safe(() => codeQualityScannerService.analyzeCodeQuality(url, pageData)),       // 5

            // New Phase 6 (indices 6-14)
            safe(() => dnsAuditService.auditDNS(url)),                                    // 6
            safe(() => techDetectorService.detectTechnologies(url, pageData)),             // 7
            safe(() => domainIntelService.getDomainIntel(url)),                            // 8
            safe(() => networkWaterfallService.analyzeNetwork(url, pageData)),             // 9
            safe(() => redirectAnalyzerService.analyzeRedirects(url)),                     // 10
            safe(() => cookieAuditService.auditCookies(url, pageData)),                   // 11
            safe(() => mobileFriendlinessService.checkMobileFriendliness(url, pageData)),  // 12
            safe(() => mixedContentService.checkMixedContent(url, pageData)),              // 13
            safe(() => blacklistCheckService.checkBlacklist(url)),                         // 14

            // New Phase 7 (indices 15-21)
            safe(() => robotsSitemapService.analyzeRobotsSitemap(url)),                     // 15
            safe(() => socialPreviewService.analyzeSocialPreview(url, pageData)),           // 16
            safe(() => imageOptimizationService.analyzeImages(url, pageData)),              // 17
            safe(() => uptimeService.analyzeUptime(url)),                                  // 18
            safe(() => legalComplianceService.analyzeLegalCompliance(url, pageData)),       // 19
            safe(() => structuredDataService.analyzeStructuredData(url, pageData)),         // 20
            safe(() => brokenImageService.detectBrokenImages(url, pageData)),               // 21
        ];

        const results = await Promise.allSettled(analysisPromises);

        // ── Step 3: Extract results ──
        const combinedResults = {
            pagespeed:          unwrap(results[0]),
            brokenLinks:        unwrap(results[1]),
            security:           unwrap(results[2]),
            seo:                unwrap(results[3]),
            accessibility:      unwrap(results[4]),
            codeQuality:        unwrap(results[5]),
            lighthouse:         null,
            // New
            dnsAudit:           unwrap(results[6]),
            techStack:          unwrap(results[7]),
            domainIntel:        unwrap(results[8]),
            networkWaterfall:   unwrap(results[9]),
            redirectChain:      unwrap(results[10]),
            cookieAudit:        unwrap(results[11]),
            mobileFriendliness: unwrap(results[12]),
            mixedContent:       unwrap(results[13]),
            blacklist:          unwrap(results[14]),
            // Phase 7
            robotsSitemap:      unwrap(results[15]),
            socialPreview:      unwrap(results[16]),
            imageOptimization:  unwrap(results[17]),
            uptime:             unwrap(results[18]),
            legalCompliance:    unwrap(results[19]),
            structuredData:     unwrap(results[20]),
            brokenImages:       unwrap(results[21]),
        };

        console.log('📝 Analysis Results:', {
            pagespeed: !!combinedResults.pagespeed,
            brokenLinks: !!combinedResults.brokenLinks,
            security: !!combinedResults.security,
            seo: !!combinedResults.seo,
            accessibility: !!combinedResults.accessibility,
            codeQuality: !!combinedResults.codeQuality,
            dnsAudit: !!combinedResults.dnsAudit,
            techStack: !!combinedResults.techStack,
            domainIntel: !!combinedResults.domainIntel,
            networkWaterfall: !!combinedResults.networkWaterfall,
            redirectChain: !!combinedResults.redirectChain,
            cookieAudit: !!combinedResults.cookieAudit,
            mobileFriendliness: !!combinedResults.mobileFriendliness,
            mixedContent: !!combinedResults.mixedContent,
            blacklist: !!combinedResults.blacklist,
            robotsSitemap: !!combinedResults.robotsSitemap,
            socialPreview: !!combinedResults.socialPreview,
            imageOptimization: !!combinedResults.imageOptimization,
            uptime: !!combinedResults.uptime,
            legalCompliance: !!combinedResults.legalCompliance,
            structuredData: !!combinedResults.structuredData,
            brokenImages: !!combinedResults.brokenImages,
        });

        // Generate final report
        const report = reportGenerator.generateWebsiteReport(url, combinedResults);

        console.log(`✅ Analysis complete for: ${url}`);
        console.log(`📊 Report: ${report.summary.critical} Critical, ${report.summary.warning} Warnings, ${report.summary.passed} Passed`);

        res.json({ status: 'success', data: report });

    } catch (error) {
        console.error('❌ Website analysis error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze website',
            details: error.message
        });
    }
};

// ── Utilities ──

/** Wrap a scanner call so it never throws */
async function safe(fn) {
    try { return await fn(); }
    catch (e) { console.log('⚠️ Scanner failed:', e.message); return null; }
}

/** Unwrap Promise.allSettled result */
function unwrap(result) {
    return result.status === 'fulfilled' ? result.value : null;
}

/** Extract JS, CSS, image URLs from HTML */
function extractResources(html, baseUrl) {
    const js = [], css = [], images = [];
    try {
        // JS
        const jsMatches = html.match(/<script[^>]+src=["']([^"']+)["']/gi) || [];
        jsMatches.forEach(m => {
            const src = m.match(/src=["']([^"']+)["']/i);
            if (src) js.push(resolveUrl(src[1], baseUrl));
        });

        // CSS
        const cssMatches = html.match(/<link[^>]+href=["']([^"']+)["'][^>]*rel=["']stylesheet["']/gi) || [];
        const cssMatches2 = html.match(/<link[^>]*rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi) || [];
        [...cssMatches, ...cssMatches2].forEach(m => {
            const href = m.match(/href=["']([^"']+)["']/i);
            if (href) css.push(resolveUrl(href[1], baseUrl));
        });

        // Images
        const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
        imgMatches.forEach(m => {
            const src = m.match(/src=["']([^"']+)["']/i);
            const alt = m.match(/alt=["']([^"']*?)["']/i);
            if (src) images.push({ url: resolveUrl(src[1], baseUrl), alt: alt ? alt[1] : '' });
        });
    } catch (e) { /* ignore parsing errors */ }

    return { js: [...new Set(js)], css: [...new Set(css)], images };
}

function resolveUrl(relative, base) {
    try { return new URL(relative, base).href; }
    catch { return relative; }
}
