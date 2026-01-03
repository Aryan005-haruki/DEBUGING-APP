const cheerio = require('cheerio');

/**
 * PHASE 1: Page Analyzer Service
 * Detailed analysis of individual pages
 */

/**
 * Analyze a single page in detail
 */
exports.analyzePage = async (html, url, options = {}) => {
    const $ = cheerio.load(html);

    return {
        content: analyzeContent($, url),
        seo: analyzeSEO($, url),
        performance: analyzePerformance($, url),
        accessibility: analyzeAccessibility($, url),
        security: analyzeSecurity($, url)
    };
};

function analyzeContent($, url) {
    // Extract text content
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    const wordCount = bodyText.split(/\s+/).length;

    // Extract main content (try to identify article/main content)
    let mainContent = '';
    const mainSelectors = ['main', 'article', '[role="main"]', '.content', '#content'];
    for (const selector of mainSelectors) {
        if ($(selector).length > 0) {
            mainContent = $(selector).first().text().trim();
            break;
        }
    }

    return {
        wordCount,
        characterCount: bodyText.length,
        paragraphCount: $('p').length,
        hasMainContent: mainContent.length > 0,
        languageDetected: $('html').attr('lang') || 'not-specified'
    };
}

function analyzeSEO($, url) {
    const title = $('title').text();
    const metaDescription = $('meta[name="description"]').attr('content');
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    const canonicalUrl = $('link[rel="canonical"]').attr('href');

    // Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');

    // Twitter Card tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');

    // Heading structure
    const headings = {
        h1Count: $('h1').length,
        h2Count: $('h2').length,
        h3Count: $('h3').length,
        h1Text: $('h1').map((i, el) => $(el).text()).get()
    };

    // Structured data
    const hasSchemaOrg = $('script[type="application/ld+json"]').length > 0;

    // Issues
    const issues = [];
    if (!title || title.length < 30 || title.length > 60) {
        issues.push({
            severity: 'warning',
            type: 'title',
            message: `Title length is ${title?.length || 0} characters (recommended: 30-60)`
        });
    }

    if (!metaDescription || metaDescription.length < 120 || metaDescription.length > 160) {
        issues.push({
            severity: 'warning',
            type: 'meta-description',
            message: `Meta description length is ${metaDescription?.length || 0} characters (recommended: 120-160)`
        });
    }

    if (headings.h1Count === 0) {
        issues.push({
            severity: 'warning',
            type: 'h1',
            message: 'No H1 heading found on page'
        });
    } else if (headings.h1Count > 1) {
        issues.push({
            severity: 'info',
            type: 'h1',
            message: `Multiple H1 headings found (${headings.h1Count})`
        });
    }

    if (!canonicalUrl) {
        issues.push({
            severity: 'info',
            type: 'canonical',
            message: 'No canonical URL specified'
        });
    }

    return {
        title: {
            text: title,
            length: title?.length || 0,
            isOptimal: title && title.length >= 30 && title.length <= 60
        },
        metaDescription: {
            text: metaDescription,
            length: metaDescription?.length || 0,
            isOptimal: metaDescription && metaDescription.length >= 120 && metaDescription.length <= 160
        },
        metaKeywords: metaKeywords || null,
        canonicalUrl: canonicalUrl || null,
        openGraph: {
            title: ogTitle,
            description: ogDescription,
            image: ogImage,
            isComplete: !!(ogTitle && ogDescription && ogImage)
        },
        twitterCard: {
            type: twitterCard,
            title: twitterTitle,
            isConfigured: !!twitterCard
        },
        headings,
        hasStructuredData: hasSchemaOrg,
        issues
    };
}

function analyzePerformance($, url) {
    const issues = [];

    // Count resources
    const imageCount = $('img').length;
    const scriptCount = $('script').length;
    const stylesheetCount = $('link[rel="stylesheet"]').length;
    const inlineScriptCount = $('script:not([src])').length;
    const inlineStyleCount = $('style').length;

    // Check for lazy loading
    const imagesWithLazyLoad = $('img[loading="lazy"]').length;
    const lazyLoadPercentage = imageCount > 0 ? (imagesWithLazyLoad / imageCount) * 100 : 0;

    // Check for large images without optimization
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
        issues.push({
            severity: 'warning',
            type: 'image-alt',
            message: `${imagesWithoutAlt} images missing alt attributes`
        });
    }

    // Check for render-blocking resources
    const renderBlockingScripts = $('script[src]:not([async]):not([defer])').length;
    if (renderBlockingScripts > 0) {
        issues.push({
            severity: 'warning',
            type: 'render-blocking',
            message: `${renderBlockingScripts} render-blocking scripts found`
        });
    }

    // Check for excessive inline scripts/styles
    if (inlineScriptCount > 5) {
        issues.push({
            severity: 'info',
            type: 'inline-scripts',
            message: `${inlineScriptCount} inline scripts found (consider bundling)`
        });
    }

    return {
        resourceCounts: {
            images: imageCount,
            scripts: scriptCount,
            stylesheets: stylesheetCount,
            inlineScripts: inlineScriptCount,
            inlineStyles: inlineStyleCount
        },
        optimization: {
            lazyLoadedImages: imagesWithLazyLoad,
            lazyLoadPercentage: Math.round(lazyLoadPercentage),
            imagesWithoutAlt: imagesWithoutAlt
        },
        issues
    };
}

function analyzeAccessibility($, url) {
    const issues = [];

    // Check for viewport meta tag
    const hasViewport = $('meta[name="viewport"]').length > 0;
    if (!hasViewport) {
        issues.push({
            severity: 'critical',
            type: 'viewport',
            message: 'Missing viewport meta tag (not mobile-friendly)'
        });
    }

    // Check for language attribute
    const htmlLang = $('html').attr('lang');
    if (!htmlLang) {
        issues.push({
            severity: 'warning',
            type: 'html-lang',
            message: 'Missing language attribute on <html> tag'
        });
    }

    // Check for images without alt text
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
        issues.push({
            severity: 'warning',
            type: 'image-alt',
            message: `${imagesWithoutAlt} images missing alt attributes`
        });
    }

    // Check for form labels
    const inputsWithoutLabels = $('input:not([type="hidden"]):not([aria-label])').filter((i, el) => {
        const id = $(el).attr('id');
        return !id || $(`label[for="${id}"]`).length === 0;
    }).length;

    if (inputsWithoutLabels > 0) {
        issues.push({
            severity: 'warning',
            type: 'form-labels',
            message: `${inputsWithoutLabels} form inputs missing labels`
        });
    }

    // Check ARIA landmarks
    const hasLandmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').length > 0;

    return {
        hasViewport,
        hasLanguage: !!htmlLang,
        language: htmlLang || null,
        hasARIALandmarks: hasLandmarks,
        accessibilityScore: calculateAccessibilityScore(issues),
        issues
    };
}

function analyzeSecurity($, url) {
    const issues = [];

    // Check for HTTPS
    const isHTTPS = url.startsWith('https://');
    if (!isHTTPS) {
        issues.push({
            severity: 'critical',
            type: 'https',
            message: 'Website is not using HTTPS'
        });
    }

    // Check for mixed content (HTTP resources on HTTPS page)
    if (isHTTPS) {
        const httpResources = [];
        $('img[src], script[src], link[href]').each((i, elem) => {
            const src = $(elem).attr('src') || $(elem).attr('href');
            if (src && src.startsWith('http://')) {
                httpResources.push(src);
            }
        });

        if (httpResources.length > 0) {
            issues.push({
                severity: 'critical',
                type: 'mixed-content',
                message: `${httpResources.length} HTTP resources found on HTTPS page`,
                details: httpResources.slice(0, 5)
            });
        }
    }

    // Check for inline event handlers (potential XSS risk)
    const inlineEventHandlers = $('[onclick], [onload], [onerror], [onmouseover]').length;
    if (inlineEventHandlers > 0) {
        issues.push({
            severity: 'warning',
            type: 'inline-events',
            message: `${inlineEventHandlers} inline event handlers found (potential XSS risk)`
        });
    }

    // Check for password fields without autocomplete
    const passwordFieldsWithoutAutocomplete = $('input[type="password"]:not([autocomplete])').length;
    if (passwordFieldsWithoutAutocomplete > 0) {
        issues.push({
            severity: 'info',
            type: 'password-autocomplete',
            message: 'Password fields should have autocomplete attribute'
        });
    }

    return {
        isHTTPS,
        securityScore: calculateSecurityScore(issues),
        issues
    };
}

function calculateAccessibilityScore(issues) {
    let score = 100;
    issues.forEach(issue => {
        if (issue.severity === 'critical') score -= 20;
        else if (issue.severity === 'warning') score -= 10;
        else if (issue.severity === 'info') score -= 5;
    });
    return Math.max(0, score);
}

function calculateSecurityScore(issues) {
    let score = 100;
    issues.forEach(issue => {
        if (issue.severity === 'critical') score -= 30;
        else if (issue.severity === 'warning') score -= 15;
        else if (issue.severity === 'info') score -= 5;
    });
    return Math.max(0, score);
}

module.exports = exports;
