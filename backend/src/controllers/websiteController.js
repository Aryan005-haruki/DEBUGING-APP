const pagespeedService = require('../services/pagespeedService');
const linkCheckerService = require('../services/linkCheckerService');
const reportGenerator = require('../services/reportGeneratorService');
const securityScannerService = require('../services/securityScannerService');
const seoScannerService = require('../services/seoScannerService'); // Phase 3
const accessibilityScannerService = require('../services/accessibilityScannerService'); // Phase 4
const codeQualityScannerService = require('../services/codeQualityScannerService'); // Phase 5
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

        // Run analyses in parallel (including Phase 2 security scan + Phase 3 SEO)
        const analysisPromises = [
            pagespeedService.analyze(url),
            linkCheckerService.analyze(url),
            // Phase 2: Quick security scan (SSL + Headers + Sensitive Data)
            axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'HealthChecker-SecurityBot/1.0'
                },
                maxRedirects: 5
            })
                .then(response => securityScannerService.quickSecurityScan(url, {
                    html: response.data,
                    headers: response.headers
                }))
                .catch(err => {
                    console.log('⚠️ Security scan failed:', err.message);
                    return null;
                }),
            // Phase 3: SEO Analysis (Meta Tags + Content + Structure + Schema + Mobile)
            axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'HealthChecker-SEOBot/1.0'
                },
                maxRedirects: 5
            })
                .then(response => seoScannerService.analyzeSEO(url, {
                    html: response.data,
                    headers: response.headers
                }))
                .catch(err => {
                    console.log('⚠️ SEO analysis failed:', err.message);
                    return null;
                }),
            // Phase 4: Accessibility Analysis (WCAG 2.1 AA)
            axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'HealthChecker-A11yBot/1.0'
                },
                maxRedirects: 5
            })
                .then(response => accessibilityScannerService.analyzeAccessibility(url, {
                    html: response.data,
                    headers: response.headers
                }))
                .catch(err => {
                    console.log('⚠️ Accessibility analysis failed:', err.message);
                    return null;
                }),
            // Phase 5: Code Quality Analysis (HTML, CSS, JS, Performance, Compatibility)
            axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'HealthChecker-QualityBot/1.0'
                },
                maxRedirects: 5
            })
                .then(response => codeQualityScannerService.analyzeCodeQuality(url, {
                    html: response.data,
                    headers: response.headers
                }))
                .catch(err => {
                    console.log('⚠️ Code quality analysis failed:', err.message);
                    return null;
                })
        ];

        const results = await Promise.allSettled(analysisPromises);

        // Extract results (even if some failed)
        const combinedResults = {
            pagespeed: results[0].status === 'fulfilled' ? results[0].value : null,
            brokenLinks: results[1].status === 'fulfilled' ? results[1].value : null,
            security: results[2].status === 'fulfilled' ? results[2].value : null,
            seo: results[3].status === 'fulfilled' ? results[3].value : null,
            accessibility: results[4].status === 'fulfilled' ? results[4].value : null, // Phase 4
            codeQuality: results[5].status === 'fulfilled' ? results[5].value : null, // Phase 5
            lighthouse: null
        };

        console.log('📝 Analysis Results:', {
            pagespeedSuccess: !!combinedResults.pagespeed,
            brokenLinksSuccess: !!combinedResults.brokenLinks,
            securitySuccess: !!combinedResults.security,
            seoSuccess: !!combinedResults.seo,
            accessibilitySuccess: !!combinedResults.accessibility, // Phase 4
            codeQualitySuccess: !!combinedResults.codeQuality // Phase 5
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
