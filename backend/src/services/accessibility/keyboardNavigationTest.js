/**
 * PHASE 4: Keyboard Navigation Tester
 * Tests keyboard accessibility and navigation
 */

const cheerio = require('cheerio');

/**
 * Test keyboard navigation accessibility
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Test results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Interactive elements must be keyboard accessible
        const interactiveAnalysis = checkInteractiveElements($);
        issues.push(...interactiveAnalysis.issues);
        penalty += interactiveAnalysis.penalty;

        // 2. Tab order should be logical
        const tabOrderAnalysis = checkTabOrder($);
        issues.push(...tabOrderAnalysis.issues);
        penalty += tabOrderAnalysis.penalty;

        // 3. Focus visible
        const focusAnalysis = checkFocusVisible($);
        issues.push(...focusAnalysis.issues);
        penalty += focusAnalysis.penalty;

        // 4. No keyboard traps
        const trapAnalysis = checkKeyboardTraps($);
        issues.push(...trapAnalysis.issues);
        penalty += trapAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                interactiveElements: $('a, button, input, select, textarea, [tabindex]').length,
                tabbableElements: $('a, button, input:not([type="hidden"]), select, textarea, [tabindex="0"]').length
            }
        };

    } catch (error) {
        console.error('Keyboard navigation test error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check interactive elements are keyboard accessible
 */
function checkInteractiveElements($) {
    const issues = [];
    let penalty = 0;

    // Find elements with click handlers
    const clickableElements = $('[onclick], [ng-click], [v-on\\:click], [@click]');

    clickableElements.each((i, el) => {
        const tagName = $(el).prop('tagName').toLowerCase();
        const tabindex = $(el).attr('tabindex');
        const role = $(el).attr('role');

        // Check if it's a div/span with click handler but not keyboard accessible
        if ((tagName === 'div' || tagName === 'span') &&
            tabindex === undefined &&
            role !== 'button' &&
            penalty < 15) {

            issues.push({
                id: 'keyboard-clickable-not-focusable',
                severity: 'CRITICAL',
                title: 'Click Elements Not Keyboard Accessible',
                description: 'Divs/spans with click handlers must be keyboard accessible',
                impact: 'Keyboard users cannot interact with these elements',
                category: 'Accessibility - Keyboard',
                fixSuggestion: {
                    title: 'Make Elements Keyboard Accessible',
                    steps: [
                        'Add tabindex="0" to make element focusable',
                        'Add role="button" for button-like elements',
                        'Add onkeydown/onkeyup handlers for Enter/Space keys',
                        'Better: Use <button> or <a> instead of div/span'
                    ]
                }
            });
            penalty = 15;
        }
    });

    // Check links have href
    const linksWithoutHref = $('a:not([href])');
    if (linksWithoutHref.length > 0) {
        issues.push({
            id: 'keyboard-links-no-href',
            severity: 'WARNING',
            title: `${linksWithoutHref.length} Links Without href`,
            description: '<a> tags without href are not keyboard accessible',
            impact: 'Cannot be reached via Tab key',
            category: 'Accessibility - Keyboard',
            fixSuggestion: {
                title: 'Add href or Use Button',
                steps: [
                    'If it\'s a link: add href attribute',
                    'If it triggers action: use <button> instead',
                    'Or add tabindex="0" and role="button"'
                ]
            }
        });
        penalty += 5;
    }

    return { issues, penalty };
}

/**
 * Check tab order is logical
 */
function checkTabOrder($) {
    const issues = [];
    let penalty = 0;

    // Check for high tabindex values (anti-pattern)
    const highTabindex = $('[tabindex]').filter((i, el) => {
        const tabindex = parseInt($(el).attr('tabindex'));
        return tabindex > 0;
    });

    if (highTabindex.length > 0) {
        issues.push({
            id: 'keyboard-tabindex-positive',
            severity: 'WARNING',
            title: 'Avoid Positive Tabindex Values',
            description: `${highTabindex.length} elements have tabindex > 0`,
            impact: 'Creates unpredictable tab order',
            category: 'Accessibility - Keyboard',
            fixSuggestion: {
                title: 'Use Natural Tab Order',
                steps: [
                    'Remove positive tabindex values',
                    'Use tabindex="0" to add to natural order',
                    'Use tabindex="-1" to remove from tab order',
                    'Restructure HTML for logical order'
                ]
            }
        });
        penalty = 10;
    }

    return { issues, penalty };
}

/**
 * Check focus is visible
 */
function checkFocusVisible($) {
    const issues = [];
    let penalty = 0;

    // Check for outline:none in style tags (very basic check)
    const styles = $('style').text();
    if (styles.includes('outline:none') || styles.includes('outline: none')) {
        issues.push({
            id: 'keyboard-focus-outline-removed',
            severity: 'CRITICAL',
            title: 'Focus Outline Removed',
            description: 'CSS removes focus outline (outline:none)',
            impact: 'Keyboard users cannot see which element has focus',
            category: 'Accessibility - Keyboard',
            fixSuggestion: {
                title: 'Show Focus Indicators',
                steps: [
                    'Remove outline:none from CSS',
                    'Or provide custom :focus styles',
                    'Ensure focus is clearly visible',
                    'Example: :focus { outline: 2px solid blue; }'
                ]
            }
        });
        penalty = 20;
    }

    return { issues, penalty };
}

/**
 * Check for keyboard traps
 */
function checkKeyboardTraps($) {
    const issues = [];
    let penalty = 0;

    // Check for modals/dialogs
    const modals = $('[role="dialog"], [role="alertdialog"], .modal, .dialog');

    if (modals.length > 0) {
        // Modal detected - provide guidance
        issues.push({
            id: 'keyboard-modal-trap-check',
            severity: 'INFO',
            title: 'Modal Keyboard Trap Check',
            description: 'Ensure modals trap focus correctly and allow escape',
            impact: 'Users must be able to exit modals with keyboard',
            category: 'Accessibility - Keyboard',
            fixSuggestion: {
                title: 'Implement Proper Modal Focus Management',
                steps: [
                    'Trap focus within modal when open (Tab cycles inside)',
                    'Move focus to first element when modal opens',
                    'Allow Escape key to close modal',
                    'Return focus to trigger element when closed',
                    'Prevent tabbing to background content'
                ]
            }
        });
    }

    return { issues, penalty };
}

module.exports = exports;
