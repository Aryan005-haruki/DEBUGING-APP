/**
 * Image Optimization Checker
 * Checks WebP usage, lazy loading, alt text, oversized images
 */
const cheerio = require('cheerio');

function analyzeImages(targetUrl, pageData) {
    const issues = [];
    let score = 100;
    const html = pageData?.html || '';
    const $ = cheerio.load(html);
    const images = $('img');
    const totalImages = images.length;

    if (totalImages === 0) {
        return { score: 100, issues: [], summary: { totalImages: 0 } };
    }

    let missingAlt = 0, noLazyLoad = 0, noWidthHeight = 0, nonOptimized = 0;
    const brokenSrcs = [];

    images.each((i, img) => {
        const $img = $(img);
        const src = $img.attr('src') || '';
        const alt = $img.attr('alt');
        const loading = $img.attr('loading');
        const width = $img.attr('width');
        const height = $img.attr('height');

        // Missing alt text
        if (alt === undefined || alt === null) {
            missingAlt++;
        }

        // No lazy loading (skip first 2 images — above the fold)
        if (i >= 2 && loading !== 'lazy') {
            noLazyLoad++;
        }

        // No explicit width/height (causes CLS)
        if (!width || !height) {
            noWidthHeight++;
        }

        // Non-optimized format (not WebP/AVIF)
        if (src && !/\.(webp|avif|svg)(\?|$)/i.test(src) && /\.(jpg|jpeg|png|gif|bmp)(\?|$)/i.test(src)) {
            nonOptimized++;
        }

        // Empty/broken src
        if (!src || src === '#' || src === 'about:blank') {
            brokenSrcs.push(src || '(empty)');
        }
    });

    // ── Generate issues ──
    if (missingAlt > 0) {
        issues.push({
            id: 'img-missing-alt',
            severity: missingAlt > 3 ? 'CRITICAL' : 'WARNING',
            title: `${missingAlt} Images Missing Alt Text`,
            description: `${missingAlt} out of ${totalImages} images have no alt attribute. Alt text is essential for accessibility and SEO.`,
            impact: 'Screen readers cannot describe images; hurts SEO image ranking',
            category: 'Accessibility'
        });
        score -= Math.min(20, missingAlt * 3);
    }

    if (noLazyLoad > 0) {
        issues.push({
            id: 'img-no-lazy',
            severity: 'WARNING',
            title: `${noLazyLoad} Images Without Lazy Loading`,
            description: `${noLazyLoad} below-the-fold images don't use loading="lazy". This causes unnecessary bandwidth usage on page load.`,
            impact: 'Slower initial page load — downloads all images upfront',
            category: 'Performance'
        });
        score -= Math.min(15, noLazyLoad * 2);
    }

    if (noWidthHeight > 0 && noWidthHeight > totalImages * 0.5) {
        issues.push({
            id: 'img-no-dimensions',
            severity: 'WARNING',
            title: `${noWidthHeight} Images Without Dimensions`,
            description: `${noWidthHeight} images missing explicit width/height attributes. This causes layout shift (CLS) when images load.`,
            impact: 'Page content jumps around as images load — poor UX',
            category: 'Performance'
        });
        score -= 10;
    }

    if (nonOptimized > 0) {
        issues.push({
            id: 'img-not-webp',
            severity: nonOptimized > 5 ? 'WARNING' : 'WARNING',
            title: `${nonOptimized} Images Not Using Modern Formats`,
            description: `${nonOptimized} images use JPEG/PNG/GIF instead of WebP/AVIF. Modern formats are 25-50% smaller.`,
            impact: `Could save ~${nonOptimized * 50}KB+ by converting to WebP`,
            category: 'Performance'
        });
        score -= Math.min(15, nonOptimized * 2);
    }

    if (brokenSrcs.length > 0) {
        issues.push({
            id: 'img-broken-src',
            severity: 'CRITICAL',
            title: `${brokenSrcs.length} Broken/Empty Image Sources`,
            description: `Found images with empty or invalid src attributes.`,
            impact: 'Broken images show as missing — unprofessional appearance',
            category: 'Content'
        });
        score -= brokenSrcs.length * 5;
    }

    // Check for responsive images (srcset)
    const withSrcset = $('img[srcset]').length;
    if (totalImages > 3 && withSrcset === 0) {
        issues.push({
            id: 'img-no-srcset',
            severity: 'WARNING',
            title: 'No Responsive Images (srcset)',
            description: 'No images use srcset for responsive loading. Mobile devices download full-size images unnecessarily.',
            impact: 'Mobile users download oversized images — slow + wasteful',
            category: 'Performance'
        });
        score -= 8;
    }

    return {
        score: Math.max(0, score),
        issues,
        summary: {
            totalImages,
            missingAlt,
            noLazyLoad,
            nonOptimized,
            totalIssues: issues.length
        }
    };
}

module.exports = { analyzeImages };
