const { getBrowser, closeBrowser } = require('../utils/browserLauncher');

/**
 * Run Lighthouse-style analysis on a URL
 * Uses Puppeteer to render and measure the page.
 * Works on both Vercel (serverless) and local/Docker environments.
 */
exports.analyze = async (url) => {
    let browser = null;
    let page = null;

    try {
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

        browser = await getBrowser();
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (compatible; HealthChecker/1.0)');
        await page.setViewport({ width: 1280, height: 800 });

        const startTime = Date.now();
        const response = await page.goto(fullUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        const loadTime = Date.now() - startTime;

        // Gather performance metrics
        const metrics = await page.metrics();
        const performanceTiming = await page.evaluate(() => {
            const t = performance.timing;
            return {
                responseTime: t.responseEnd - t.requestStart,
                domInteractive: t.domInteractive - t.navigationStart,
                domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart,
                loadEventEnd: t.loadEventEnd - t.navigationStart,
            };
        });

        // Gather page content for quick analysis
        const content = await page.content();
        const title = await page.title();

        await page.close();

        // Calculate approximate scores
        const performanceScore = calculatePerformanceScore(loadTime, performanceTiming);
        
        return {
            scores: {
                performance: performanceScore,
                accessibility: 0,    // Requires full axe-core run
                bestPractices: response && response.ok() ? 80 : 60,
                seo: title ? 75 : 50
            },
            metrics: {
                loadTime,
                domInteractive: performanceTiming.domInteractive,
                domContentLoaded: performanceTiming.domContentLoaded,
                scriptDuration: Math.round(metrics.ScriptDuration * 1000),
                taskDuration: Math.round(metrics.TaskDuration * 1000),
                jsHeapUsed: Math.round(metrics.JSHeapUsedSize / 1024 / 1024) + 'MB'
            }
        };

    } catch (error) {
        console.error('Lighthouse analysis error:', error.message);
        if (page) await page.close().catch(() => {});
        return null;
    }
};

function calculatePerformanceScore(loadTime, timing) {
    // Fast < 2.5s → 90–100, Needs improvement 2.5–4s → 50–89, Slow > 4s → 0–49
    let score = 100;
    if (loadTime > 4000) score -= 50;
    else if (loadTime > 2500) score -= 25;
    if (timing.domContentLoaded > 3000) score -= 15;
    if (timing.domInteractive > 2000) score -= 10;
    return Math.max(0, Math.min(100, score));
}

module.exports = exports;
