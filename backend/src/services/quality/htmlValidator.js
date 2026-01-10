/**
 * PHASE 5: HTML Validator
 * Validates HTML quality, semantic usage, and W3C compliance
 */

const cheerio = require('cheerio');

/**
 * Validate HTML quality
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Validation results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '', { decodeEntities: false });

        // 1. Doctype check
        const doctypeAnalysis = checkDoctype(pageData.html);
        issues.push(...doctypeAnalysis.issues);
        penalty += doctypeAnalysis.penalty;

        // 2. Deprecated tags
        const deprecatedAnalysis = checkDeprecatedTags($);
        issues.push(...deprecatedAnalysis.issues);
        penalty += deprecatedAnalysis.penalty;

        // 3. Required meta tags
        const metaAnalysis = checkRequiredMeta($);
        issues.push(...metaAnalysis.issues);
        penalty += metaAnalysis.penalty;

        // 4. Semantic HTML
        const semanticAnalysis = checkSemanticHTML($);
        issues.push(...semanticAnalysis.issues);
        penalty += semanticAnalysis.penalty;

        // 5. Attribute errors
        const attributeAnalysis = checkAttributes($);
        issues.push(...attributeAnalysis.issues);
        penalty += attributeAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                hasDoctype: doctypeAnalysis.hasDoctype,
                deprecatedTagsFound: deprecatedAnalysis.count,
                semanticElementsUsed: semanticAnalysis.count
            }
        };

    } catch (error) {
        console.error('HTML validation error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check for proper doctype
 */
function checkDoctype(html) {
    const issues = [];
    let penalty = 0;
    let hasDoctype = false;

    // Check for HTML5 doctype
    const hasHTML5Doctype = /<!DOCTYPE html>/i.test(html);
    hasDoctype = hasHTML5Doctype;

    if (!hasHTML5Doctype) {
        issues.push({
            id: 'html-no-doctype',
            severity: 'CRITICAL',
            title: 'Missing or Invalid Doctype',
            description: 'Page should have <!DOCTYPE html> declaration',
            impact: 'Browser may render in quirks mode',
            category: 'Code Quality - HTML',
            fixSuggestion: {
                title: 'Add HTML5 Doctype',
                steps: [
                    'Add as first line: <!DOCTYPE html>',
                    'Use HTML5 doctype for modern web standards',
                    'Ensures standards mode rendering'
                ]
            }
        });
        penalty = 15;
    }

    return { issues, penalty, hasDoctype };
}

/**
 * Check for deprecated HTML tags
 */
function checkDeprecatedTags($) {
    const issues = [];
    let penalty = 0;

    const deprecatedTags = ['center', 'font', 'marquee', 'blink', 'big', 'strike', 'tt', 'frame', 'frameset'];
    let foundDeprecated = [];

    deprecatedTags.forEach(tag => {
        const elements = $(tag);
        if (elements.length > 0) {
            foundDeprecated.push(tag);
        }
    });

    if (foundDeprecated.length > 0) {
        issues.push({
            id: 'html-deprecated-tags',
            severity: 'WARNING',
            title: `Deprecated HTML Tags: ${foundDeprecated.join(', ')}`,
            description: 'These tags are obsolete and should not be used',
            impact: 'May not be supported in modern browsers',
            category: 'Code Quality - HTML',
            fixSuggestion: {
                title: 'Replace Deprecated Tags',
                steps: [
                    'Replace <center> with CSS text-align',
                    'Replace <font> with CSS styling',
                    'Replace <marquee> with CSS animations',
                    'Use modern HTML5 and CSS3'
                ]
            }
        });
        penalty = foundDeprecated.length * 5;
    }

    return { issues, penalty, count: foundDeprecated.length };
}

/**
 * Check for required meta tags
 */
function checkRequiredMeta($) {
    const issues = [];
    let penalty = 0;

    // Check for charset
    const charset = $('meta[charset]').attr('charset') ||
        ($('meta[http-equiv="Content-Type"]').attr('content') || '').match(/charset=([^;]+)/)?.[1];

    if (!charset) {
        issues.push({
            id: 'html-no-charset',
            severity: 'WARNING',
            title: 'Missing Character Encoding',
            description: 'No charset meta tag found',
            impact: 'Characters may not display correctly',
            category: 'Code Quality - HTML',
            fixSuggestion: {
                title: 'Add Charset Meta Tag',
                steps: [
                    'Add in <head>: <meta charset="UTF-8">',
                    'Place before <title> tag',
                    'UTF-8 is recommended for modern web'
                ]
            }
        });
        penalty = 5;
    }

    // Check for viewport (mobile)
    const viewport = $('meta[name="viewport"]').length;
    if (!viewport) {
        issues.push({
            id: 'html-no-viewport',
            severity: 'WARNING',
            title: 'Missing Viewport Meta Tag',
            description: 'Required for responsive design',
            impact: 'Page may not scale on mobile devices',
            category: 'Code Quality - HTML'
        });
        penalty += 5;
    }

    return { issues, penalty };
}

/**
 * Check semantic HTML usage
 */
function checkSemanticHTML($) {
    const issues = [];
    let penalty = 0;

    const semanticTags = ['header', 'nav', 'main', 'article', 'section', 'aside', 'footer'];
    let semanticCount = 0;

    semanticTags.forEach(tag => {
        semanticCount += $(tag).length;
    });

    // If very few semantic tags, suggest using them
    if (semanticCount < 2) {
        const divCount = $('div').length;
        if (divCount > 10) {
            issues.push({
                id: 'html-not-semantic',
                severity: 'INFO',
                title: 'Limited Semantic HTML Usage',
                description: 'Consider using semantic HTML5 elements',
                impact: 'Semantic HTML improves SEO and accessibility',
                category: 'Code Quality - HTML',
                fixSuggestion: {
                    title: 'Use Semantic HTML Elements',
                    steps: [
                        'Replace divs with <header>, <nav>, <main>, <footer>',
                        'Use <article> for standalone content',
                        'Use <section> for thematic grouping',
                        'Improves code readability and SEO'
                    ]
                }
            });
        }
    }

    return { issues, penalty, count: semanticCount };
}

/**
 * Check for common attribute errors
 */
function checkAttributes($) {
    const issues = [];
    let penalty = 0;

    // Check for images without alt (already checked in accessibility, just count)
    const imgsWithoutAlt = $('img:not([alt])').length;

    // Check for links without href
    const linksWithoutHref = $('a:not([href])').length;
    if (linksWithoutHref > 0) {
        issues.push({
            id: 'html-links-no-href',
            severity: 'WARNING',
            title: `${linksWithoutHref} Links Without href Attribute`,
            description: 'Anchor tags should have href attribute',
            impact: 'Not functional without href',
            category: 'Code Quality - HTML'
        });
        penalty = 3;
    }

    // Check for duplicate IDs
    const allIds = $('[id]').map((i, el) => $(el).attr('id')).get();
    const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    const uniqueDuplicates = [...new Set(duplicates)];

    if (uniqueDuplicates.length > 0) {
        issues.push({
            id: 'html-duplicate-ids',
            severity: 'CRITICAL',
            title: `${uniqueDuplicates.length} Duplicate IDs Found`,
            description: 'IDs must be unique on a page',
            impact: 'Causes HTML validation errors',
            category: 'Code Quality - HTML',
            fixSuggestion: {
                title: 'Make IDs Unique',
                steps: [
                    'Ensure each id="" is used only once',
                    'Use classes for styling multiple elements',
                    'Generate unique IDs if needed'
                ]
            }
        });
        penalty += 10;
    }

    return { issues, penalty };
}

module.exports = exports;
