/**
 * PHASE 5: JavaScript Analyzer
 * Analyzes JavaScript quality, errors, and optimization
 */

const cheerio = require('cheerio');

/**
 * Analyze JavaScript quality
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. External JS files
        const externalJS = checkExternalJS($);
        issues.push(...externalJS.issues);
        penalty += externalJS.penalty;

        // 2. Inline scripts
        const inlineScripts = checkInlineScripts($);
        issues.push(...inlineScripts.issues);
        penalty += inlineScripts.penalty;

        // 3. Minification
        const minification = checkMinification($);
        issues.push(...minification.issues);
        penalty += minification.penalty;

        // 4. Deprecated patterns
        const deprecated = checkDeprecatedPatterns($);
        issues.push(...deprecated.issues);
        penalty += deprecated.penalty;

        // 5. Console statements
        const consoleStatements = checkConsoleStatements($);
        issues.push(...consoleStatements.issues);
        penalty += consoleStatements.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                externalScripts: externalJS.count,
                inlineScripts: inlineScripts.count,
                minified: minification.minifiedCount
            }
        };

    } catch (error) {
        console.error('JavaScript analysis error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check external JavaScript files
 */
function checkExternalJS($) {
    const issues = [];
    let penalty = 0;

    const scripts = $('script[src]');
    const count = scripts.length;

    // Too many JS files
    if (count > 10) {
        issues.push({
            id: 'js-too-many-files',
            severity: 'WARNING',
            title: `${count} JavaScript Files Loaded`,
            description: 'Too many JS files can slow page load',
            impact: 'Multiple HTTP requests hurt performance',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Bundle JavaScript Files',
                steps: [
                    'Combine multiple JS files',
                    'Use bundler (webpack, rollup, parcel)',
                    'Code splitting for async loading',
                    'Tree shaking to remove unused code'
                ]
            }
        });
        penalty = 8;
    }

    // Check for blocking scripts in <head>
    const blockingScripts = $('head script[src]:not([defer]):not([async])');
    if (blockingScripts.length > 0) {
        issues.push({
            id: 'js-render-blocking',
            severity: 'CRITICAL',
            title: `${blockingScripts.length} Render-Blocking Scripts`,
            description: 'Scripts in <head> without defer/async block page rendering',
            impact: 'Significantly slows initial page load',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Fix Render-Blocking Scripts',
                steps: [
                    'Add defer attribute: <script defer src="...">',
                    'Or use async for independent scripts',
                    'Move scripts to end of <body>',
                    'Improves Time to Interactive (TTI)'
                ]
            }
        });
        penalty += 15;
    }

    return { issues, penalty, count };
}

/**
 * Check inline scripts
 */
function checkInlineScripts($) {
    const issues = [];
    let penalty = 0;

    const inlineScripts = $('script:not([src])');
    const count = inlineScripts.length;

    // Too many inline scripts
    if (count > 5) {
        issues.push({
            id: 'js-excessive-inline',
            severity: 'WARNING',
            title: `${count} Inline Script Tags`,
            description: 'Excessive inline scripts reduce maintainability',
            impact: 'Cannot be cached, harder to maintain',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Move to External Files',
                steps: [
                    'Extract inline scripts to .js files',
                    'Improves caching and maintainability',
                    'Reserve inline for critical above-fold code only'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty, count };
}

/**
 * Check minification
 */
function checkMinification($) {
    const issues = [];
    let penalty = 0;

    const scripts = $('script[src]');
    let minifiedCount = 0;
    let unminifiedCount = 0;

    scripts.each((i, script) => {
        const src = $(script).attr('src') || '';
        if (src.includes('.min.js') || src.includes('minified')) {
            minifiedCount++;
        } else {
            unminifiedCount++;
        }
    });

    if (unminifiedCount > 0 && scripts.length > 0) {
        issues.push({
            id: 'js-not-minified',
            severity: 'WARNING',
            title: `${unminifiedCount} Scripts May Not Be Minified`,
            description: 'JavaScript files should be minified for production',
            impact: 'Larger file sizes, slower downloads',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Minify JavaScript',
                steps: [
                    'Use minifier (Terser, UglifyJS)',
                    'Build process should minify for production',
                    'Reduces file size by 30-50%',
                    'Keep source maps for debugging'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty, minifiedCount };
}

/**
 * Check for deprecated patterns
 */
function checkDeprecatedPatterns($) {
    const issues = [];
    let penalty = 0;

    // Check for document.write
    let hasDeprecated = false;
    $('script:not([src])').each((i, script) => {
        const code = $(script).html() || '';
        if (code.includes('document.write')) {
            hasDeprecated = true;
        }
    });

    if (hasDeprecated) {
        issues.push({
            id: 'js-document-write',
            severity: 'WARNING',
            title: 'Deprecated: document.write() Detected',
            description: 'document.write() is deprecated and blocks parsing',
            impact: 'Blocks page rendering, bad for performance',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Replace document.write()',
                steps: [
                    'Use DOM manipulation: createElement(), appendChild()',
                    'Or use innerHTML',
                    'Modern frameworks handle this automatically'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Check for console statements
 */
function checkConsoleStatements($) {
    const issues = [];
    let penalty = 0;

    let consoleCount = 0;
    $('script:not([src])').each((i, script) => {
        const code = $(script).html() || '';
        const matches = code.match(/console\.(log|error|warn|debug)/g);
        if (matches) {
            consoleCount += matches.length;
        }
    });

    if (consoleCount > 3) {
        issues.push({
            id: 'js-console-statements',
            severity: 'INFO',
            title: `${consoleCount} Console Statements Found`,
            description: 'Remove console statements from production code',
            impact: 'Minor performance impact, clutters browser console',
            category: 'Code Quality - JavaScript',
            fixSuggestion: {
                title: 'Remove Console Statements',
                steps: [
                    'Remove or comment out console.log() in production',
                    'Use build tools to strip console statements',
                    'Or use proper logging library'
                ]
            }
        });
    }

    return { issues, penalty };
}

module.exports = exports;
