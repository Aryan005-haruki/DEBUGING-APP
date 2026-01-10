/**
 * PHASE 3: Duplicate Detector
 * Detects duplicate content, titles, and meta descriptions
 */

const cheerio = require('cheerio');

/**
 * Detect duplicate/thin content issues
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Check for duplicate meta tags on same page
        const metaDuplicates = checkDuplicateMetaTags($);
        issues.push(...metaDuplicates.issues);
        penalty += metaDuplicates.penalty;

        // 2. Check for boilerplate/template content
        const boilerplateCheck = checkBoilerplateContent($);
        issues.push(...boilerplateCheck.issues);
        penalty += boilerplateCheck.penalty;

        // 3. Check canonical tag
        const canonicalCheck = checkCanonical($, pageData.url);
        issues.push(...canonicalCheck.issues);
        penalty += canonicalCheck.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                canonicalPresent: $('link[rel="canonical"]').length > 0
            }
        };

    } catch (error) {
        console.error('Duplicate detection error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

/**
 * Check for duplicate meta tags on same page
 */
function checkDuplicateMetaTags($) {
    const issues = [];
    let penalty = 0;

    // Check for duplicate titles
    const titleCount = $('title').length;
    if (titleCount > 1) {
        issues.push({
            id: 'duplicate-title',
            severity: 'WARNING',
            title: 'Duplicate Title Tags',
            description: `Page has ${titleCount} <title> tags (should be 1)`,
            impact: 'Confuses search engines',
            category: 'SEO - Duplicates',
            fixSuggestion: {
                title: 'Remove Duplicate Titles',
                steps: [
                    'Keep only one <title> tag',
                    'Remove extras from template/plugins'
                ]
            }
        });
        penalty = 10;
    }

    // Check for duplicate meta descriptions
    const descCount = $('meta[name="description"]').length;
    if (descCount > 1) {
        issues.push({
            id: 'duplicate-description',
            severity: 'WARNING',
            title: 'Duplicate Meta Description',
            description: `Page has ${descCount} meta descriptions (should be 1)`,
            impact: 'Search engines may ignore them',
            category: 'SEO - Duplicates'
        });
        penalty += 5;
    }

    // Check for duplicate canonical tags
    const canonicalCount = $('link[rel="canonical"]').length;
    if (canonicalCount > 1) {
        issues.push({
            id: 'duplicate-canonical',
            severity: 'WARNING',
            title: 'Multiple Canonical Tags',
            description: `Page has ${canonicalCount} canonical tags (should be 0 or 1)`,
            impact: 'Search engines may ignore canonical directive',
            category: 'SEO - Duplicates'
        });
        penalty += 5;
    }

    return { issues, penalty };
}

/**
 * Check for excessive boilerplate content
 */
function checkBoilerplateContent($) {
    const issues = [];
    let penalty = 0;

    // Remove scripts, styles
    $('script, style, nav, footer, header').remove();
    const mainContent = $('main, article, .content, #content').text();
    const bodyContent = $('body').text();

    if (mainContent.length === 0 && bodyContent.length > 0) {
        // No main content container found
        issues.push({
            id: 'duplicate-no-main',
            severity: 'WARNING',
            title: 'No Main Content Container',
            description: 'No <main>, <article>, or .content element found',
            impact: 'Hard to distinguish main content from boilerplate',
            category: 'SEO - Duplicates',
            fixSuggestion: {
                title: 'Add Semantic HTML',
                steps: [
                    'Wrap main content in <main> or <article>',
                    'Helps search engines identify unique content',
                    'Improves accessibility'
                ]
            }
        });
        penalty = 5;
    }

    // Check content to boilerplate ratio
    if (mainContent.length > 0 && bodyContent.length > 0) {
        const ratio = mainContent.length / bodyContent.length;
        if (ratio < 0.3) {
            issues.push({
                id: 'duplicate-low-content-ratio',
                severity: 'WARNING',
                title: 'Low Content-to-Boilerplate Ratio',
                description: `Main content is only ${(ratio * 100).toFixed(0)}% of page`,
                impact: 'Too much boilerplate/navigation may dilute SEO value',
                category: 'SEO - Duplicates',
                fixSuggestion: {
                    title: 'Increase Unique Content',
                    steps: [
                        'Add more unique content to the page',
                        'Reduce boilerplate/template text',
                        'Focus on valuable, original information'
                    ]
                }
            });
            penalty = 5;
        }
    }

    return { issues, penalty };
}

/**
 * Check canonical tag
 */
function checkCanonical($, currentUrl) {
    const issues = [];
    let penalty = 0;

    const canonical = $('link[rel="canonical"]').attr('href');

    if (!canonical) {
        // Canonical is optional but recommended
        issues.push({
            id: 'duplicate-no-canonical',
            severity: 'INFO',
            title: 'No Canonical URL',
            description: 'Page doesn\'t specify a canonical URL',
            impact: 'Use canonical to avoid duplicate content issues',
            category: 'SEO - Duplicates',
            fixSuggestion: {
                title: 'Add Canonical Tag',
                steps: [
                    'Add: <link rel="canonical" href="https://yoursite.com/page">',
                    'Points to the preferred version of this page',
                    'Helps consolidate duplicate content signals'
                ]
            }
        });
        // No penalty for missing canonical (it's optional)
    } else if (currentUrl) {
        // Check if canonical points to self (good practice)
        try {
            const currentUrlObj = new URL(currentUrl);
            const canonicalUrlObj = new URL(canonical, currentUrl);

            if (currentUrlObj.hostname !== canonicalUrlObj.hostname) {
                issues.push({
                    id: 'duplicate-external-canonical',
                    severity: 'WARNING',
                    title: 'Canonical Points to Different Domain',
                    description: 'Canonical URL is on a different domain',
                    impact: 'You\'re telling Google the original is elsewhere',
                    category: 'SEO - Duplicates'
                });
                penalty = 5;
            }
        } catch (e) {
            // Invalid URL
        }
    }

    return { issues, penalty };
}

module.exports = exports;
