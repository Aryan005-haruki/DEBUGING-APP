/**
 * PHASE 5: CSS Validator
 * Validates CSS quality, specificity, and optimization
 */

const cheerio = require('cheerio');

/**
 * Validate CSS quality
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Validation results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. External CSS files
        const externalCSS = checkExternalCSS($);
        issues.push(...externalCSS.issues);
        penalty += externalCSS.penalty;

        // 2. Inline styles
        const inlineStyles = checkInlineStyles($);
        issues.push(...inlineStyles.issues);
        penalty += inlineStyles.penalty;

        // 3. CSS in <style> tags
        const styleTags = checkStyleTags($);
        issues.push(...styleTags.issues);
        penalty += styleTags.penalty;

        // 4. !important usage
        const importantUsage = checkImportantUsage($);
        issues.push(...importantUsage.issues);
        penalty += importantUsage.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                externalStylesheets: externalCSS.count,
                inlineStyleElements: inlineStyles.count,
                styleTagsFound: styleTags.count
            }
        };

    } catch (error) {
        console.error('CSS validation error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check external CSS files
 */
function checkExternalCSS($) {
    const issues = [];
    let penalty = 0;

    const stylesheets = $('link[rel="stylesheet"]');
    const count = stylesheets.length;

    // Too many CSS files
    if (count > 5) {
        issues.push({
            id: 'css-too-many-files',
            severity: 'WARNING',
            title: `${count} CSS Files Loaded`,
            description: 'Too many CSS files can slow page load',
            impact: 'Multiple HTTP requests hurt performance',
            category: 'Code Quality - CSS',
            fixSuggestion: {
                title: 'Combine CSS Files',
                steps: [
                    'Combine multiple CSS files into one',
                    'Use CSS bundler (webpack, parcel)',
                    'Minify CSS for production',
                    'Consider critical CSS inline'
                ]
            }
        });
        penalty = 5;
    }

    // Check for minified CSS
    let unminifiedCount = 0;
    stylesheets.each((i, link) => {
        const href = $(link).attr('href') || '';
        if (!href.includes('.min.css') && !href.includes('minified')) {
            unminifiedCount++;
        }
    });

    if (unminifiedCount > 0 && count > 0) {
        issues.push({
            id: 'css-not-minified',
            severity: 'INFO',
            title: 'CSS Files May Not Be Minified',
            description: `${unminifiedCount} CSS files don't appear minified`,
            impact: 'Minified CSS reduces file size by 20-30%',
            category: 'Code Quality - CSS',
            fixSuggestion: {
                title: 'Minify CSS Files',
                steps: [
                    'Use CSS minifier (cssnano, clean-css)',
                    'Build process should minify for production',
                    'Reduces bandwidth and load time'
                ]
            }
        });
    }

    return { issues, penalty, count };
}

/**
 * Check inline styles
 */
function checkInlineStyles($) {
    const issues = [];
    let penalty = 0;

    const elementsWithStyle = $('[style]');
    const count = elementsWithStyle.length;

    // Too many inline styles
    if (count > 20) {
        issues.push({
            id: 'css-excessive-inline',
            severity: 'WARNING',
            title: `${count} Elements With Inline Styles`,
            description: 'Excessive inline styles reduce maintainability',
            impact: 'Hard to maintain, cannot be cached',
            category: 'Code Quality - CSS',
            fixSuggestion: {
                title: 'Move Styles to CSS Files',
                steps: [
                    'Extract inline styles to CSS classes',
                    'Use external stylesheets',
                    'Improves caching and maintainability',
                    'Reserve inline styles for dynamic values only'
                ]
            }
        });
        penalty = 10;
    }

    return { issues, penalty, count };
}

/**
 * Check <style> tags
 */
function checkStyleTags($) {
    const issues = [];
    let penalty = 0;

    const styleTags = $('style');
    const count = styleTags.length;

    // Multiple style tags
    if (count > 2) {
        issues.push({
            id: 'css-multiple-style-tags',
            severity: 'INFO',
            title: `${count} <style> Tags Found`,
            description: 'Multiple <style> tags can be consolidated',
            impact: 'Better organization with external CSS',
            category: 'Code Quality - CSS',
            fixSuggestion: {
                title: 'Consolidate CSS',
                steps: [
                    'Combine multiple <style> tags',
                    'Move to external CSS file',
                    'Easier to maintain and cache'
                ]
            }
        });
    }

    return { issues, penalty, count };
}

/**
 * Check !important usage
 */
function checkImportantUsage($) {
    const issues = [];
    let penalty = 0;

    // Check in style tags
    let importantCount = 0;
    $('style').each((i, style) => {
        const css = $(style).html() || '';
        const matches = css.match(/!important/g);
        if (matches) {
            importantCount += matches.length;
        }
    });

    // Check in inline styles
    $('[style]').each((i, el) => {
        const style = $(el).attr('style') || '';
        if (style.includes('!important')) {
            importantCount++;
        }
    });

    if (importantCount > 5) {
        issues.push({
            id: 'css-excessive-important',
            severity: 'WARNING',
            title: `Excessive !important Usage (${importantCount})`,
            description: 'Too many !important declarations',
            impact: 'Makes CSS hard to maintain and override',
            category: 'Code Quality - CSS',
            fixSuggestion: {
                title: 'Reduce !important Usage',
                steps: [
                    'Use proper CSS specificity instead',
                    'Reorganize CSS cascade',
                    '!important should be rare exception',
                    'Refactor CSS architecture'
                ]
            }
        });
        penalty = 8;
    }

    return { issues, penalty };
}

module.exports = exports;
