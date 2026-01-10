/**
 * PHASE 5: Browser Compatibility Checker
 * Checks for browser compatibility issues and vendor prefixes
 */

const cheerio = require('cheerio');

/**
 * Analyze browser compatibility
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Vendor prefixes
        const prefixes = checkVendorPrefixes($);
        issues.push(...prefixes.issues);
        penalty += prefixes.penalty;

        // 2. Deprecated features
        const deprecated = checkDeprecatedFeatures($);
        issues.push(...deprecated.issues);
        penalty += deprecated.penalty;

        // 3. Modern features without fallbacks
        const modernFeatures = checkModernFeatures($);
        issues.push(...modernFeatures.issues);
        penalty += modernFeatures.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                vendorPrefixesNeeded: prefixes.count,
                deprecatedFeaturesFound: deprecated.count
            }
        };

    } catch (error) {
        console.error('Browser compatibility check error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check for vendor prefixes in CSS
 */
function checkVendorPrefixes($) {
    const issues = [];
    let penalty = 0;
    let count = 0;

    // Check style tags
    $('style').each((i, style) => {
        const css = $(style).html() || '';

        // Check for modern CSS properties that might need prefixes
        const modernProps = ['flex', 'grid', 'sticky', 'backdrop-filter'];
        const hasPrefixes = css.match(/-webkit-|-moz-|-ms-/);

        modernProps.forEach(prop => {
            if (css.includes(prop) && !hasPrefixes) {
                count++;
            }
        });
    });

    if (count > 0) {
        issues.push({
            id: 'compat-missing-prefixes',
            severity: 'INFO',
            title: 'May Need Vendor Prefixes',
            description: 'Some CSS properties may need vendor prefixes for older browsers',
            impact: 'Features may not work in older browsers',
            category: 'Code Quality - Compatibility',
            fixSuggestion: {
                title: 'Add Vendor Prefixes',
                steps: [
                    'Use autoprefixer in build process',
                    'Automatically adds necessary prefixes',
                    'Example: -webkit-flex, -ms-flex, flex',
                    'Or use PostCSS with autoprefixer plugin'
                ]
            }
        });
    }

    return { issues, penalty, count };
}

/**
 * Check for deprecated/removed features
 */
function checkDeprecatedFeatures($) {
    const issues = [];
    let penalty = 0;
    let count = 0;

    // Check for Flash/Silverlight
    const flash = $('object[type="application/x-shockwave-flash"], embed[type="application/x-shockwave-flash"]');
    if (flash.length > 0) {
        issues.push({
            id: 'compat-flash',
            severity: 'CRITICAL',
            title: 'Flash Content Detected',
            description: 'Flash is no longer supported by browsers',
            impact: 'Content will not work in modern browsers',
            category: 'Code Quality - Compatibility',
            fixSuggestion: {
                title: 'Replace Flash',
                steps: [
                    'Convert to HTML5/JavaScript',
                    'Use Canvas or WebGL for animations',
                    'Use HTML5 video for media',
                    'Flash ended support in December 2020'
                ]
            }
        });
        penalty = 20;
        count++;
    }

    // Check for AppCache (deprecated)
    const hasAppCache = $('html[manifest]').length > 0;
    if (hasAppCache) {
        issues.push({
            id: 'compat-appcache',
            severity: 'WARNING',
            title: 'AppCache Detected (Deprecated)',
            description: 'Application Cache is deprecated',
            impact: 'Will be removed from browsers',
            category: 'Code Quality - Compatibility',
            fixSuggestion: {
                title: 'Migrate to Service Workers',
                steps: [
                    'Replace AppCache with Service Workers',
                    'Service Workers provide better offline support',
                    'More flexible and powerful',
                    'Use Workbox library for easier implementation'
                ]
            }
        });
        penalty += 5;
        count++;
    }

    return { issues, penalty, count };
}

/**
 * Check for modern features without polyfills
 */
function checkModernFeatures($) {
    const issues = [];
    let penalty = 0;

    // Check for modern JS in inline scripts
    let usesModernJS = false;
    $('script:not([src])').each((i, script) => {
        const code = $(script).html() || '';
        // Check for arrow functions, const/let, etc.
        if (code.includes('=>') || code.includes('const ') || code.includes('let ')) {
            usesModernJS = true;
        }
    });

    if (usesModernJS) {
        issues.push({
            id: 'compat-modern-js',
            severity: 'INFO',
            title: 'Modern JavaScript Detected',
            description: 'ES6+ features may not work in older browsers',
            impact: 'Consider transpiling for broader support',
            category: 'Code Quality - Compatibility',
            fixSuggestion: {
                title: 'Transpile JavaScript',
                steps: [
                    'Use Babel to transpile ES6+ to ES5',
                    'Add polyfills for Promise, fetch, etc.',
                    'Use @babel/preset-env for automatic polyfills',
                    'Ensures compatibility with older browsers'
                ]
            }
        });
    }

    // Check for <picture> element (needs polyfill for IE)
    const hasPicture = $('picture').length > 0;
    if (hasPicture) {
        issues.push({
            id: 'compat-picture-element',
            severity: 'INFO',
            title: '<picture> Element Used',
            description: 'Consider polyfill for older browsers',
            impact: 'Not supported in IE11 and older',
            category: 'Code Quality - Compatibility',
            fixSuggestion: {
                title: 'Add Polyfill for <picture>',
                steps: [
                    'Use picturefill.js polyfill',
                    'Or use srcset polyfill',
                    'Ensures responsive images work everywhere'
                ]
            }
        });
    }

    return { issues, penalty };
}

module.exports = exports;
