const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

/**
 * Run Lighthouse analysis on a URL
 * Note: This requires Chrome to be installed on the server
 * For free hosting, this might not work - PageSpeed API is recommended instead
 */
exports.analyze = async (url) => {
    let chrome = null;

    try {
        // Make sure URL has protocol
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

        // Launch Chrome
        chrome = await chromeLauncher.launch({
            chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
        });

        const options = {
            logLevel: 'error',
            output: 'json',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
            port: chrome.port
        };

        // Run Lighthouse
        const runnerResult = await lighthouse(fullUrl, options);

        await chrome.kill();

        const categories = runnerResult.lhr.categories;
        const audits = runnerResult.lhr.audits;

        return {
            scores: {
                performance: Math.round(categories.performance.score * 100),
                accessibility: Math.round(categories.accessibility.score * 100),
                bestPractices: Math.round(categories['best-practices'].score * 100),
                seo: Math.round(categories.seo.score * 100)
            },
            audits: extractKeyAudits(audits)
        };

    } catch (error) {
        console.error('Lighthouse analysis error:', error.message);
        if (chrome) {
            await chrome.kill().catch(() => { });
        }
        return null;
    }
};

function extractKeyAudits(audits) {
    const keyAuditIds = [
        'first-contentful-paint',
        'largest-contentful-paint',
        'total-blocking-time',
        'cumulative-layout-shift',
        'speed-index'
    ];

    return keyAuditIds
        .filter(id => audits[id])
        .map(id => ({
            id,
            title: audits[id].title,
            score: audits[id].score,
            displayValue: audits[id].displayValue,
            description: audits[id].description
        }));
}

module.exports = exports;
