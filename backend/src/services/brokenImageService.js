/**
 * Broken Image Detector
 * Checks for broken, missing, or inaccessible images
 */
const cheerio = require('cheerio');
const axios = require('axios');

async function detectBrokenImages(targetUrl, pageData) {
    const issues = [];
    let score = 100;
    const html = pageData?.html || '';
    const $ = cheerio.load(html);
    const images = [];

    // Collect all image URLs
    $('img').each((i, el) => {
        const src = $(el).attr('src');
        const alt = $(el).attr('alt') || '';
        if (src && src !== '#' && src !== 'about:blank' && !src.startsWith('data:')) {
            try {
                const fullUrl = new URL(src, targetUrl).href;
                images.push({ url: fullUrl, alt, index: i });
            } catch (e) { /* invalid URL */ }
        }
    });

    // Also check CSS background images
    $('[style*="background"]').each((i, el) => {
        const style = $(el).attr('style') || '';
        const match = style.match(/url\(['"]?([^'")\s]+)['"]?\)/i);
        if (match) {
            try {
                const fullUrl = new URL(match[1], targetUrl).href;
                images.push({ url: fullUrl, alt: 'CSS background', index: -1 });
            } catch (e) { /* ignore */ }
        }
    });

    if (images.length === 0) {
        return { score: 100, issues: [], summary: { totalImages: 0, brokenCount: 0 } };
    }

    // Check images (max 20 to avoid timeout)
    const toCheck = images.slice(0, 20);
    const brokenImages = [];
    const slowImages = [];

    const checkPromises = toCheck.map(async (img) => {
        try {
            const start = Date.now();
            const res = await axios.head(img.url, {
                timeout: 5000,
                validateStatus: () => true,
                headers: { 'User-Agent': 'HealthChecker-ImageBot/1.0' }
            });
            const elapsed = Date.now() - start;

            if (res.status >= 400) {
                brokenImages.push({ ...img, status: res.status });
            } else if (elapsed > 3000) {
                slowImages.push({ ...img, loadTime: elapsed });
            }
        } catch (e) {
            brokenImages.push({ ...img, status: 0, error: e.code || e.message });
        }
    });

    await Promise.allSettled(checkPromises);

    // ── Generate Issues ──
    if (brokenImages.length > 0) {
        const details = brokenImages.slice(0, 5).map(img => {
            const name = img.url.split('/').pop().substring(0, 40);
            return `• ${name} (HTTP ${img.status || 'timeout'})`;
        }).join('\n');

        issues.push({
            id: 'broken-images',
            severity: 'CRITICAL',
            title: `${brokenImages.length} Broken Image${brokenImages.length > 1 ? 's' : ''} Found`,
            description: `${brokenImages.length} images returned errors or are inaccessible:\n${details}`,
            impact: 'Users see broken image icons — damages credibility and UX',
            category: 'Broken Images'
        });
        score -= brokenImages.length * 8;
    }

    if (slowImages.length > 0) {
        issues.push({
            id: 'slow-images',
            severity: 'WARNING',
            title: `${slowImages.length} Slow-Loading Image${slowImages.length > 1 ? 's' : ''}`,
            description: `${slowImages.length} images took over 3 seconds to respond.`,
            impact: 'Slow images delay page rendering and frustrate users',
            category: 'Performance'
        });
        score -= slowImages.length * 3;
    }

    // Check for images without alt on broken ones
    const brokenWithoutAlt = brokenImages.filter(img => !img.alt);
    if (brokenWithoutAlt.length > 0) {
        issues.push({
            id: 'broken-images-no-alt',
            severity: 'WARNING',
            title: `${brokenWithoutAlt.length} Broken Images Without Alt Text`,
            description: 'Broken images with no alt text provide zero information to users when the image fails to load.',
            impact: 'Screen readers and browsers show nothing — users get no context',
            category: 'Accessibility'
        });
        score -= 5;
    }

    return {
        score: Math.max(0, score),
        issues,
        summary: {
            totalImages: images.length,
            checkedCount: toCheck.length,
            brokenCount: brokenImages.length,
            slowCount: slowImages.length,
            totalIssues: issues.length
        }
    };
}

module.exports = { detectBrokenImages };
