/**
 * PHASE 3: Structure Analyzer
 * Analyzes page structure, headings, images, and links
 */

const cheerio = require('cheerio');

/**
 * Analyze page structure
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Heading Hierarchy
        const headingAnalysis = analyzeHeadings($);
        issues.push(...headingAnalysis.issues);
        penalty += headingAnalysis.penalty;

        // 2. Image Alt Tags
        const imageAnalysis = analyzeImages($);
        issues.push(...imageAnalysis.issues);
        penalty += imageAnalysis.penalty;

        // 3. Links Analysis
        const linkAnalysis = analyzeLinks($);
        issues.push(...linkAnalysis.issues);
        penalty += linkAnalysis.penalty;

        // 4. URL Structure
        const urlAnalysis = analyzeURL(pageData.url);
        issues.push(...urlAnalysis.issues);
        penalty += urlAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                h1Count: $('h1').length,
                images: $('img').length,
                imagesWithAlt: $('img[alt]').length,
                links: $('a').length
            }
        };

    } catch (error) {
        console.error('Structure analysis error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

/**
 * Analyze heading hierarchy
 */
function analyzeHeadings($) {
    const issues = [];
    let penalty = 0;

    const h1Count = $('h1').length;

    // Check H1 presence
    if (h1Count === 0) {
        issues.push({
            id: 'structure-no-h1',
            severity: 'CRITICAL',
            title: 'Missing H1 Tag',
            description: 'No H1 heading found on page',
            impact: 'H1 is critical for SEO and user experience',
            category: 'SEO - Structure',
            fixSuggestion: {
                title: 'Add H1 Tag',
                steps: [
                    'Add exactly one <h1> tag to the page',
                    'Make it descriptive of page content',
                    'Include primary keyword',
                    'Place it near the top of the page'
                ]
            }
        });
        penalty = 20;
    } else if (h1Count > 1) {
        issues.push({
            id: 'structure-multiple-h1',
            severity: 'WARNING',
            title: 'Multiple H1 Tags',
            description: `Found ${h1Count} H1 tags (should be only 1)`,
            impact: 'May confuse search engines about page topic',
            category: 'SEO - Structure',
            fixSuggestion: {
                title: 'Use Only One H1',
                steps: [
                    'Keep only the most important H1',
                    'Change others to H2 or H3',
                    'Maintain logical heading hierarchy'
                ]
            }
        });
        penalty = 10;
    }

    // Check heading hierarchy (h2, h3, h4, etc.)
    const h2Count = $('h2').length;
    const h3Count = $('h3').length;

    if (h1Count > 0 && h2Count === 0 && h3Count > 0) {
        issues.push({
            id: 'structure-heading-hierarchy',
            severity: 'WARNING',
            title: 'Broken Heading Hierarchy',
            description: 'H3 tags used without H2 tags',
            impact: 'Improper heading structure may confuse users and search engines',
            category: 'SEO - Structure'
        });
        penalty += 5;
    }

    return { issues, penalty };
}

/**
 * Analyze images
 */
function analyzeImages($) {
    const issues = [];
    let penalty = 0;

    const images = $('img');
    const imagesWithoutAlt = images.filter((i, img) => !$(img).attr('alt')).length;

    if (imagesWithoutAlt > 0) {
        issues.push({
            id: 'structure-missing-alt',
            severity: imagesWithoutAlt === images.length ? 'CRITICAL' : 'WARNING',
            title: 'Images Missing Alt Text',
            description: `${imagesWithoutAlt} of ${images.length} images missing alt text`,
            impact: 'Hurts accessibility and SEO',
            category: 'SEO - Structure',
            fixSuggestion: {
                title: 'Add Alt Text',
                steps: [
                    'Add alt="" to all images',
                    'Describe what the image shows',
                    'Include keywords naturally when relevant',
                    'Use alt="" for decorative images'
                ]
            }
        });
        penalty = imagesWithoutAlt === images.length ? 15 : 5;
    }

    // Check for empty alt tags
    const emptyAlt = images.filter((i, img) => {
        const alt = $(img).attr('alt');
        return alt !== undefined && alt.trim() === '';
    }).length;

    if (emptyAlt > images.length / 2) {
        issues.push({
            id: 'structure-empty-alt',
            severity: 'WARNING',
            title: 'Too Many Empty Alt Tags',
            description: `${emptyAlt} images have empty alt=""`,
            impact: 'Missing opportunity for SEO and accessibility',
            category: 'SEO - Structure'
        });
        penalty += 3;
    }

    return { issues, penalty };
}

/**
 * Analyze links
 */
function analyzeLinks($) {
    const issues = [];
    let penalty = 0;

    const allLinks = $('a[href]');
    const internalLinks = allLinks.filter((i, link) => {
        const href = $(link).attr('href');
        return href && (href.startsWith('/') || href.startsWith('#') || href.includes(pageData.hostname));
    }).length;

    // Check for internal links
    if (internalLinks === 0 && allLinks.length > 0) {
        issues.push({
            id: 'structure-no-internal-links',
            severity: 'WARNING',
            title: 'No Internal Links',
            description: 'Page has no links to other pages on your site',
            impact: 'Internal linking helps SEO and user navigation',
            category: 'SEO - Structure',
            fixSuggestion: {
                title: 'Add Internal Links',
                steps: [
                    'Link to related content on your site',
                    'Use descriptive anchor text',
                    'Help users discover more content',
                    'Aim for 2-5 internal links per page'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze URL structure
 */
function analyzeURL(url) {
    const issues = [];
    let penalty = 0;

    if (!url) return { issues, penalty };

    try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;

        // Check URL length
        if (path.length > 100) {
            issues.push({
                id: 'structure-url-long',
                severity: 'WARNING',
                title: 'Long URL',
                description: `URL path is ${path.length} characters (recommended: < 100)`,
                impact: 'Long URLs may be truncated in search results',
                category: 'SEO - Structure'
            });
            penalty = 3;
        }

        // Check for underscores (hyphens are better)
        if (path.includes('_')) {
            issues.push({
                id: 'structure-url-underscores',
                severity: 'WARNING',
                title: 'URL Contains Underscores',
                description: 'URLs should use hyphens (-) instead of underscores (_)',
                impact: 'Minor SEO issue - hyphens are preferred',
                category: 'SEO - Structure'
            });
            penalty = 2;
        }

        // Check for parameters (? in URL)
        if (urlObj.search && urlObj.search.length > 50) {
            issues.push({
                id: 'structure-url-parameters',
                severity: 'WARNING',
                title: 'Complex URL Parameters',
                description: 'URL has many query parameters',
                impact: 'Clean URLs are better for SEO',
                category: 'SEO - Structure'
            });
            penalty = 3;
        }

    } catch (e) {
        // Invalid URL
    }

    return { issues, penalty };
}

module.exports = exports;
