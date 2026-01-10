/**
 * PHASE 3: Mobile Optimizer
 * Analyzes mobile optimization and responsive design
 */

const cheerio = require('cheerio');

/**
 * Analyze mobile optimization
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Viewport Check
        const viewportAnalysis = analyzeViewport($);
        issues.push(...viewportAnalysis.issues);
        penalty += viewportAnalysis.penalty;

        // 2. Font Size Check
        const fontAnalysis = analyzeFontSizes($);
        issues.push(...fontAnalysis.issues);
        penalty += fontAnalysis.penalty;

        // 3. Touch Target Size
        const touchAnalysis = analyzeTouchTargets($);
        issues.push(...touchAnalysis.issues);
        penalty += touchAnalysis.penalty;

        // 4. Responsive Images
        const imageAnalysis = analyzeResponsiveImages($);
        issues.push(...imageAnalysis.issues);
        penalty += imageAnalysis.penalty;

        //'5. Flash Content Check
        const flashAnalysis = analyzeFlashContent($);
        issues.push(...flashAnalysis.issues);
        penalty += flashAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                hasViewport: $('meta[name="viewport"]').length > 0,
                hasResponsiveImages: $('img[srcset]').length > 0
            }
        };

    } catch (error) {
        console.error('Mobile optimization error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

/**
 * Analyze viewport meta tag
 */
function analyzeViewport($) {
    const issues = [];
    let penalty = 0;

    const viewport = $('meta[name="viewport"]').attr('content');

    if (!viewport) {
        issues.push({
            id: 'mobile-no-viewport',
            severity: 'CRITICAL',
            title: 'Missing Viewport Meta Tag',
            description: 'No viewport meta tag - page may not be mobile-friendly',
            impact: 'Critical for mobile users - page may look broken on phones',
            category: 'SEO - Mobile',
            fixSuggestion: {
                title: 'Add Viewport Tag',
                steps: [
                    'Add to <head>: <meta name="viewport" content="width=device-width, initial-scale=1">',
                    'This makes your site responsive'
                ]
            }
        });
        penalty = 20;
    } else if (!viewport.includes('width=device-width')) {
        issues.push({
            id: 'mobile-viewport-incorrect',
            severity: 'WARNING',
            title: 'Viewport Not Optimized',
            description: 'Viewport should include width=device-width',
            impact: 'May not scale properly on all devices',
            category: 'SEO - Mobile'
        });
        penalty = 10;
    }

    return { issues, penalty };
}

/**
 * Analyze font sizes
 */
function analyzeFontSizes($) {
    const issues = [];
    let penalty = 0;

    // Check for font-size in style attributes (simplified check)
    let tinyFonts = 0;

    $('[style*="font-size"]').each((i, elem) => {
        const style = $(elem).attr('style') || '';
        // Simple regex to find font-size values
        const fontMatch = style.match(/font-size:\s*(\d+)px/i);
        if (fontMatch && parseInt(fontMatch[1]) < 16) {
            tinyFonts++;
        }
    });

    if (tinyFonts > 5) {
        issues.push({
            id: 'mobile-small-fonts',
            severity: 'WARNING',
            title: 'Text Too Small',
            description: `${tinyFonts} elements have font-size < 16px`,
            impact: 'Text may be hard to read on mobile',
            category: 'SEO - Mobile',
            fixSuggestion: {
                title: 'Increase Font Size',
                steps: [
                    'Use minimum 16px for body text',
                    'Bigger is better for readability',
                    'Test on actual mobile devices'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze touch target sizes
 */
function analyzeTouchTargets($) {
    const issues = [];
    let penalty = 0;

    // Check button and link density (simplified)
    const buttons = $('button, a, input[type="button"], input[type="submit"]');

    // If there are many interactive elements close together, warn about touch targets
    if (buttons.length > 20) {
        issues.push({
            id: 'mobile-touch-targets',
            severity: 'WARNING',
            title: 'Check Touch Target Sizes',
            description: 'Many interactive elements - ensure they\'re large enough',
            impact: 'Small touch targets are frustrating on mobile',
            category: 'SEO - Mobile',
            fixSuggestion: {
                title: 'Optimize Touch Targets',
                steps: [
                    'Make buttons/links at least 48x48 pixels',
                    'Add spacing between clickable elements',
                    'Test on real mobile devices'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Analyze responsive images
 */
function analyzeResponsiveImages($) {
    const issues = [];
    let penalty = 0;

    const images = $('img');
    const responsiveImages = $('img[srcset], picture');

    if (images.length > 5 && responsiveImages.length === 0) {
        issues.push({
            id: 'mobile-no-responsive-images',
            severity: 'WARNING',
            title: 'No Responsive Images',
            description: 'Images don\'t use srcset or picture elements',
            impact: 'May load large images on mobile, slowing page',
            category: 'SEO - Mobile',
            fixSuggestion: {
                title: 'Use Responsive Images',
                steps: [
                    'Use <picture> element or srcset attribute',
                    'Serve smaller images to mobile devices',
                    'Improves mobile page speed'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Check for Flash content
 */
function analyzeFlashContent($) {
    const issues = [];
    let penalty = 0;

    const flash = $('embed[type="application/x-shockwave-flash"], object[type="application/x-shockwave-flash"]');

    if (flash.length > 0) {
        issues.push({
            id: 'mobile-flash-content',
            severity: 'CRITICAL',
            title: 'Flash Content Detected',
            description: 'Page uses Flash - not supported on mobile',
            impact: 'Flash doesn\'t work on phones/tablets',
            category: 'SEO - Mobile',
            fixSuggestion: {
                title: 'Remove Flash',
                steps: [
                    'Replace Flash with HTML5/JavaScript',
                    'Flash is deprecated and unsupported',
                    'Use modern web technologies'
                ]
            }
        });
        penalty = 20;
    }

    return { issues, penalty };
}

module.exports = exports;
