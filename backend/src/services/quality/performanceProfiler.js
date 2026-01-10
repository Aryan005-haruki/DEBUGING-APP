/**
 * PHASE 5: Performance Profiler
 * Analyzes performance issues, render-blocking resources, and optimization
 */

const cheerio = require('cheerio');

/**
 * Analyze performance optimization
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Render-blocking resources
        const renderBlocking = checkRenderBlocking($);
        issues.push(...renderBlocking.issues);
        penalty += renderBlocking.penalty;

        // 2. Image optimization
        const imageOpt = checkImageOptimization($);
        issues.push(...imageOpt.issues);
        penalty += imageOpt.penalty;

        // 3. Resource hints
        const hints = checkResourceHints($);
        issues.push(...hints.issues);
        penalty += hints.penalty;

        // 4. Lazy loading
        const lazyLoad = checkLazyLoading($);
        issues.push(...lazyLoad.issues);
        penalty += lazyLoad.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                renderBlockingResources: renderBlocking.count,
                totalImages: imageOpt.totalImages,
                lazyLoadedImages: lazyLoad.count
            }
        };

    } catch (error) {
        console.error('Performance profiling error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check render-blocking resources
 */
function checkRenderBlocking($) {
    const issues = [];
    let penalty = 0;

    // CSS in head without media query
    const blockingCSS = $('head link[rel="stylesheet"]:not([media])');
    const count = blockingCSS.length;

    if (count > 3) {
        issues.push({
            id: 'perf-render-blocking-css',
            severity: 'WARNING',
            title: `${count} Render-Blocking CSS Files`,
            description: 'CSS files block rendering until fully loaded',
            impact: 'Delays First Contentful Paint (FCP)',
            category: 'Code Quality - Performance',
            fixSuggestion: {
                title: 'Optimize CSS Loading',
                steps: [
                    'Inline critical CSS in <head>',
                    'Load non-critical CSS asynchronously',
                    'Use media queries to defer print CSS',
                    'Example: <link rel="preload" as="style" href="..." onload="this.rel=\'stylesheet\'">'
                ]
            }
        });
        penalty = 10;
    }

    // Synchronous scripts in head
    const blockingJS = $('head script[src]:not([defer]):not([async])');
    if (blockingJS.length > 0) {
        issues.push({
            id: 'perf-render-blocking-js',
            severity: 'CRITICAL',
            title: `${blockingJS.length} Render-Blocking JavaScript Files`,
            description: 'Scripts in <head> without defer/async block HTML parsing',
            impact: 'Significantly delays page load',
            category: 'Code Quality - Performance'
        });
        penalty += 15;
    }

    return { issues, penalty, count: count + blockingJS.length };
}

/**
 * Check image optimization
 */
function checkImageOptimization($) {
    const issues = [];
    let penalty = 0;

    const images = $('img');
    const totalImages = images.length;

    // Check for modern formats
    let modernFormats = 0;
    images.each((i, img) => {
        const src = $(img).attr('src') || '';
        if (src.includes('.webp') || src.includes('.avif')) {
            modernFormats++;
        }
    });

    if (totalImages > 5 && modernFormats === 0) {
        issues.push({
            id: 'perf-no-modern-images',
            severity: 'WARNING',
            title: 'Not Using Modern Image Formats',
            description: 'No WebP or AVIF images detected',
            impact: 'Modern formats reduce file size by 25-35%',
            category: 'Code Quality - Performance',
            fixSuggestion: {
                title: 'Use Modern Image Formats',
                steps: [
                    'Convert images to WebP or AVIF',
                    'Use <picture> with fallbacks',
                    'Example: <picture><source type="image/webp" srcset="..."><img src="fallback.jpg"></picture>',
                    'Smaller file sizes = faster loading'
                ]
            }
        });
        penalty = 8;
    }

    // Check for explicit width/height
    let missingDimensions = 0;
    images.each((i, img) => {
        const hasWidth = $(img).attr('width');
        const hasHeight = $(img).attr('height');
        if (!hasWidth || !hasHeight) {
            missingDimensions++;
        }
    });

    if (missingDimensions > 3 && totalImages > 0) {
        issues.push({
            id: 'perf-image-no-dimensions',
            severity: 'WARNING',
            title: `${missingDimensions} Images Without Dimensions`,
            description: 'Images should have width and height attributes',
            impact: 'Causes layout shifts (CLS)',
            category: 'Code Quality - Performance',
            fixSuggestion: {
                title: 'Add Image Dimensions',
                steps: [
                    'Add width and height attributes to <img>',
                    'Prevents Cumulative Layout Shift (CLS)',
                    'Browser reserves space before image loads',
                    'Improves Core Web Vitals score'
                ]
            }
        });
        penalty += 5;
    }

    return { issues, penalty, totalImages };
}

/**
 * Check resource hints
 */
function checkResourceHints($) {
    const issues = [];
    let penalty = 0;

    const preconnect = $('link[rel="preconnect"]').length;
    const dnsPrefetch = $('link[rel="dns-prefetch"]').length;
    const preload = $('link[rel="preload"]').length;

    // No resource hints at all
    if (preconnect === 0 && dnsPrefetch === 0 && preload === 0) {
        issues.push({
            id: 'perf-no-resource-hints',
            severity: 'INFO',
            title: 'No Resource Hints Found',
            description: 'Consider using resource hints for better performance',
            impact: 'Resource hints can improve load times',
            category: 'Code Quality - Performance',
            fixSuggestion: {
                title: 'Add Resource Hints',
                steps: [
                    'Use <link rel="preconnect"> for critical origins',
                    'Use <link rel="dns-prefetch"> for DNS resolution',
                    'Use <link rel="preload"> for critical resources',
                    'Example: <link rel="preconnect" href="https://fonts.googleapis.com">'
                ]
            }
        });
    }

    return { issues, penalty };
}

/**
 * Check lazy loading
 */
function checkLazyLoading($) {
    const issues = [];
    let penalty = 0;

    const images = $('img');
    const lazyImages = $('img[loading="lazy"]');
    const count = lazyImages.length;

    // Many images but no lazy loading
    if (images.length > 10 && count === 0) {
        issues.push({
            id: 'perf-no-lazy-loading',
            severity: 'WARNING',
            title: 'Images Not Lazy Loaded',
            description: 'Consider lazy loading below-the-fold images',
            impact: 'All images load immediately, slowing initial load',
            category: 'Code Quality - Performance',
            fixSuggestion: {
                title: 'Implement Lazy Loading',
                steps: [
                    'Add loading="lazy" to below-fold images',
                    'Keep first 2-3 images eager loading',
                    'Native browser lazy loading (modern browsers)',
                    'Example: <img src="..." loading="lazy">'
                ]
            }
        });
        penalty = 8;
    }

    return { issues, penalty, count };
}

module.exports = exports;
