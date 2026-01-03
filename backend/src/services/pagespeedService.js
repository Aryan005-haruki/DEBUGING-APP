const axios = require('axios');
const config = require('../config/config');

/**
 * Analyze website using Google PageSpeed Insights API
 */
exports.analyze = async (url) => {
    try {
        const apiKey = config.apiKeys.googlePageSpeed;

        if (!apiKey) {
            console.warn('⚠️ Google PageSpeed API key not configured');
            return null;
        }

        // Make sure URL has protocol
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

        const apiUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

        // Run analysis for both mobile and desktop
        const [mobileResponse, desktopResponse] = await Promise.all([
            axios.get(apiUrl, {
                params: {
                    url: fullUrl,
                    key: apiKey,
                    category: ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'],
                    strategy: 'MOBILE'
                }
            }),
            axios.get(apiUrl, {
                params: {
                    url: fullUrl,
                    key: apiKey,
                    category: ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'],
                    strategy: 'DESKTOP'
                }
            })
        ]);

        const mobileData = mobileResponse.data;
        const desktopData = desktopResponse.data;

        return {
            mobile: extractPageSpeedMetrics(mobileData),
            desktop: extractPageSpeedMetrics(desktopData)
        };

    } catch (error) {
        console.error('PageSpeed API error:', error.message);
        return null;
    }
};

function extractPageSpeedMetrics(data) {
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    return {
        scores: {
            performance: Math.round((categories.performance?.score || 0) * 100),
            accessibility: Math.round((categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
            seo: Math.round((categories.seo?.score || 0) * 100)
        },
        metrics: {
            firstContentfulPaint: audits['first-contentful-paint']?.displayValue,
            largestContentfulPaint: audits['largest-contentful-paint']?.displayValue,
            totalBlockingTime: audits['total-blocking-time']?.displayValue,
            cumulativeLayoutShift: audits['cumulative-layout-shift']?.displayValue,
            speedIndex: audits['speed-index']?.displayValue,
            timeToInteractive: audits['interactive']?.displayValue
        },
        opportunities: extractOpportunities(audits),
        diagnostics: extractDiagnostics(audits)
    };
}

function extractOpportunities(audits) {
    const opportunityKeys = [
        'render-blocking-resources',
        'unused-css-rules',
        'unused-javascript',
        'modern-image-formats',
        'offscreen-images',
        'unminified-css',
        'unminified-javascript',
        'efficient-animated-content',
        'duplicated-javascript',
        'legacy-javascript'
    ];

    return opportunityKeys
        .filter(key => audits[key] && audits[key].score < 1)
        .map(key => ({
            id: key,
            title: audits[key].title,
            description: audits[key].description,
            score: audits[key].score,
            displayValue: audits[key].displayValue,
            details: audits[key].details
        }));
}

function extractDiagnostics(audits) {
    const diagnosticKeys = [
        'uses-long-cache-ttl',
        'total-byte-weight',
        'dom-size',
        'critical-request-chains',
        'user-timings',
        'bootup-time',
        'mainthread-work-breakdown',
        'font-display',
        'uses-responsive-images'
    ];

    return diagnosticKeys
        .filter(key => audits[key])
        .map(key => ({
            id: key,
            title: audits[key].title,
            description: audits[key].description,
            displayValue: audits[key].displayValue,
            score: audits[key].score
        }));
}

module.exports = exports;
