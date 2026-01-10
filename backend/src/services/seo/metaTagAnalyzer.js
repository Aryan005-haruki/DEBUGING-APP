/**
 * PHASE 3: Meta Tag Analyzer
 * Analyzes 30+ meta tags for SEO optimization
 */

const cheerio = require('cheerio');

/**
 * Analyze all meta tags on a page
 * @param {Object} pageData - Page data with HTML and headers
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let score = 100;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Title Tag Analysis
        const titleAnalysis = analyzeTitle($);
        issues.push(...titleAnalysis.issues);
        score -= titleAnalysis.penalty;

        // 2. Meta Description Analysis
        const descAnalysis = analyzeMetaDescription($);
        issues.push(...descAnalysis.issues);
        score -= descAnalysis.penalty;

        // 3. Viewport Meta Tag
        const viewportAnalysis = analyzeViewport($);
        issues.push(...viewportAnalysis.issues);
        score -= viewportAnalysis.penalty;

        // 4. Open Graph Tags
        const ogAnalysis = analyzeOpenGraph($);
        issues.push(...ogAnalysis.issues);
        score -= ogAnalysis.penalty;

        // 5. Twitter Card Tags
        const twitterAnalysis = analyzeTwitterCard($);
        issues.push(...twitterAnalysis.issues);
        score -= twitterAnalysis.penalty;

        // 6. Canonical URL
        const canonicalAnalysis = analyzeCanonical($);
        issues.push(...canonicalAnalysis.issues);
        score -= canonicalAnalysis.penalty;

        // 7. Robots Meta Tag
        const robotsAnalysis = analyzeRobots($);
        issues.push(...robotsAnalysis.issues);
        score -= robotsAnalysis.penalty;

        // 8. Author & Other Meta Tags
        const otherAnalysis = analyzeOtherMeta($);
        issues.push(...otherAnalysis.issues);
        score -= otherAnalysis.penalty;

        return {
            score: Math.max(0, score),
            issues,
            summary: {
                totalChecks: 30,
                passed: 30 - issues.length,
                failed: issues.length
            }
        };

    } catch (error) {
        console.error('Meta tag analysis error:', error.message);
        return {
            score: 0,
            issues: [{
                id: 'meta-error',
                severity: 'CRITICAL',
                title: 'Meta Tag Analysis Failed',
                description: error.message,
                impact: 'Unable to analyze meta tags',
                category: 'SEO - Meta Tags'
            }],
            error: error.message
        };
    }
};

/**
 * Analyze title tag
 */
function analyzeTitle($) {
    const issues = [];
    let penalty = 0;

    const title = $('title').first().text().trim();

    if (!title) {
        issues.push({
            id: 'meta-title-missing',
            severity: 'CRITICAL',
            title: 'Missing Title Tag',
            description: 'No <title> tag found in the page',
            impact: 'Critical for SEO - title appears in search results',
            category: 'SEO - Meta Tags',
            fixSuggestion: {
                title: 'Add Title Tag',
                steps: [
                    'Add <title> tag inside <head> section',
                    'Keep it 50-60 characters long',
                    'Include primary keyword near the beginning',
                    'Make it unique and descriptive'
                ]
            }
        });
        penalty = 20;
    } else if (title.length < 30) {
        issues.push({
            id: 'meta-title-short',
            severity: 'WARNING',
            title: 'Title Tag Too Short',
            description: `Title is ${title.length} characters (recommended: 50-60)`,
            impact: 'May not fully utilize search result space',
            category: 'SEO - Meta Tags',
            fixSuggestion: {
                title: 'Expand Title',
                steps: [
                    'Expand title to 50-60 characters',
                    'Add relevant keywords',
                    'Include brand name if space permits'
                ]
            }
        });
        penalty = 5;
    } else if (title.length > 60) {
        issues.push({
            id: 'meta-title-long',
            severity: 'WARNING',
            title: 'Title Tag Too Long',
            description: `Title is ${title.length} characters (recommended: 50-60)`,
            impact: 'May be truncated in search results',
            category: 'SEO - Meta Tags',
            fixSuggestion: {
                title: 'Shorten Title',
                steps: [
                    'Shorten title to 50-60 characters',
                    'Keep most important keywords at the start',
                    'Remove filler words'
                ]
            }
        });
        penalty = 5;
    }

    // Check for multiple title tags
    const titleCount = $('title').length;
    if (titleCount > 1) {
        issues.push({
            id: 'meta-title-duplicate',
            severity: 'WARNING',
            title: 'Multiple Title Tags',
            description: `Found ${titleCount} title tags (should be only 1)`,
            impact: 'Search engines may get confused',
            category: 'SEO - Meta Tags'
        });
        penalty += 5;
    }

    return { issues, penalty };
}

/**
 * Analyze meta description
 */
function analyzeMetaDescription($) {
    const issues = [];
    let penalty = 0;

    const description = $('meta[name="description"]').attr('content') || '';

    if (!description) {
        issues.push({
            id: 'meta-desc-missing',
            severity: 'CRITICAL',
            title: 'Missing Meta Description',
            description: 'No meta description found',
            impact: 'Search engines will generate their own snippet',
            category: 'SEO - Meta Tags',
            fixSuggestion: {
                title: 'Add Meta Description',
                steps: [
                    'Add <meta name="description" content="..."> in <head>',
                    'Keep it 150-160 characters',
                    'Include target keywords naturally',
                    'Make it compelling to encourage clicks'
                ]
            }
        });
        penalty = 15;
    } else if (description.length < 120) {
        issues.push({
            id: 'meta-desc-short',
            severity: 'WARNING',
            title: 'Meta Description Too Short',
            description: `Description is ${description.length} characters (recommended: 150-160)`,
            impact: 'Not fully utilizing search snippet space',
            category: 'SEO - Meta Tags'
        });
        penalty = 5;
    } else if (description.length > 160) {
        issues.push({
            id: 'meta-desc-long',
            severity: 'WARNING',
            title: 'Meta Description Too Long',
            description: `Description is ${description.length} characters (recommended: 150-160)`,
            impact: 'Will be truncated in search results',
            category: 'SEO - Meta Tags'
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze viewport meta tag
 */
function analyzeViewport($) {
    const issues = [];
    let penalty = 0;

    const viewport = $('meta[name="viewport"]').attr('content');

    if (!viewport) {
        issues.push({
            id: 'meta-viewport-missing',
            severity: 'CRITICAL',
            title: 'Missing Viewport Meta Tag',
            description: 'No viewport meta tag found',
            impact: 'Page may not be mobile-friendly',
            category: 'SEO - Meta Tags',
            fixSuggestion: {
                title: 'Add Viewport Tag',
                steps: [
                    'Add: <meta name="viewport" content="width=device-width, initial-scale=1">',
                    'This makes your site responsive on mobile devices'
                ]
            }
        });
        penalty = 15;
    } else if (!viewport.includes('width=device-width')) {
        issues.push({
            id: 'meta-viewport-incorrect',
            severity: 'WARNING',
            title: 'Viewport Not Optimized',
            description: 'Viewport should include "width=device-width"',
            impact: 'May not scale properly on mobile',
            category: 'SEO - Meta Tags'
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze Open Graph tags
 */
function analyzeOpenGraph($) {
    const issues = [];
    let penalty = 0;

    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogUrl = $('meta[property="og:url"]').attr('content');

    if (!ogTitle) {
        issues.push({
            id: 'meta-og-title-missing',
            severity: 'WARNING',
            title: 'Missing OG Title',
            description: 'No og:title meta tag for social sharing',
            impact: 'Facebook/LinkedIn previews may not look good',
            category: 'SEO - Meta Tags'
        });
        penalty = 3;
    }

    if (!ogDescription) {
        issues.push({
            id: 'meta-og-desc-missing',
            severity: 'WARNING',
            title: 'Missing OG Description',
            description: 'No og:description for social sharing',
            impact: 'Social media previews will be incomplete',
            category: 'SEO - Meta Tags'
        });
        penalty += 2;
    }

    if (!ogImage) {
        issues.push({
            id: 'meta-og-image-missing',
            severity: 'WARNING',
            title: 'Missing OG Image',
            description: 'No og:image for social sharing',
            impact: 'Posts won\'t have preview image on social media',
            category: 'SEO - Meta Tags'
        });
        penalty += 3;
    }

    return { issues, penalty };
}

/**
 * Analyze Twitter Card tags
 */
function analyzeTwitterCard($) {
    const issues = [];
    let penalty = 0;

    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content');
    const twitterImage = $('meta[name="twitter:image"]').attr('content');

    if (!twitterCard) {
        issues.push({
            id: 'meta-twitter-card-missing',
            severity: 'WARNING',
            title: 'Missing Twitter Card',
            description: 'No twitter:card meta tag',
            impact: 'Twitter previews won\'t be optimized',
            category: 'SEO - Meta Tags'
        });
        penalty = 2;
    }

    return { issues, penalty };
}

/**
 * Analyze canonical URL
 */
function analyzeCanonical($) {
    const issues = [];
    let penalty = 0;

    const canonical = $('link[rel="canonical"]').attr('href');
    const canonicalCount = $('link[rel="canonical"]').length;

    if (canonicalCount > 1) {
        issues.push({
            id: 'meta-canonical-multiple',
            severity: 'WARNING',
            title: 'Multiple Canonical Tags',
            description: `Found ${canonicalCount} canonical tags (should be only 1)`,
            impact: 'Search engines may get confused',
            category: 'SEO - Meta Tags'
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze robots meta tag
 */
function analyzeRobots($) {
    const issues = [];
    let penalty = 0;

    const robots = $('meta[name="robots"]').attr('content');

    if (robots && (robots.includes('noindex') || robots.includes('nofollow'))) {
        issues.push({
            id: 'meta-robots-restrictive',
            severity: 'WARNING',
            title: 'Restrictive Robots Meta Tag',
            description: `Robots tag set to: ${robots}`,
            impact: 'Page may not be indexed properly',
            category: 'SEO - Meta Tags'
        });
        penalty = 3;
    }

    return { issues, penalty };
}

/**
 * Analyze other important meta tags
 */
function analyzeOtherMeta($) {
    const issues = [];
    let penalty = 0;

    // Check for charset
    const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content');
    if (!charset) {
        issues.push({
            id: 'meta-charset-missing',
            severity: 'WARNING',
            title: 'Missing Charset Declaration',
            description: 'No charset meta tag found',
            impact: 'May cause character encoding issues',
            category: 'SEO - Meta Tags'
        });
        penalty = 2;
    }

    return { issues, penalty };
}

module.exports = exports;
