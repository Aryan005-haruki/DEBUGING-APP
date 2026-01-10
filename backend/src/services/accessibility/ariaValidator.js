/**
 * PHASE 4: ARIA Validator
 * Validates ARIA roles, states, properties, and landmarks
 */

const cheerio = require('cheerio');

/**
 * Validate ARIA implementation
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Validation results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Check ARIA Landmarks
        const landmarkAnalysis = checkLandmarks($);
        issues.push(...landmarkAnalysis.issues);
        penalty += landmarkAnalysis.penalty;

        // 2. Check ARIA Roles
        const roleAnalysis = checkRoles($);
        issues.push(...roleAnalysis.issues);
        penalty += roleAnalysis.penalty;

        // 3. Check ARIA States and Properties
        const stateAnalysis = checkStatesAndProperties($);
        issues.push(...stateAnalysis.issues);
        penalty += stateAnalysis.penalty;

        // 4. Check ARIA Live Regions
        const liveRegionAnalysis = checkLiveRegions($);
        issues.push(...liveRegionAnalysis.issues);
        penalty += liveRegionAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                landmarks: $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').length,
                ariaElements: $('[role], [aria-label], [aria-labelledby]').length
            }
        };

    } catch (error) {
        console.error('ARIA validation error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check ARIA Landmarks
 */
function checkLandmarks($) {
    const issues = [];
    let penalty = 0;

    // Check for main landmark
    const mainLandmark = $('main, [role="main"]');
    if (mainLandmark.length === 0) {
        issues.push({
            id: 'aria-main-missing',
            severity: 'WARNING',
            title: 'Missing Main Landmark',
            description: 'Page should have <main> or role="main" for main content',
            impact: 'Screen reader users cannot quickly navigate to main content',
            category: 'Accessibility - ARIA',
            fixSuggestion: {
                title: 'Add Main Landmark',
                steps: [
                    'Wrap main content in <main> tag',
                    'Or add role="main" to container',
                    'Should be only one per page'
                ]
            }
        });
        penalty = 5;
    } else if (mainLandmark.length > 1) {
        issues.push({
            id: 'aria-multiple-main',
            severity: 'WARNING',
            title: 'Multiple Main Landmarks',
            description: 'Only one main landmark should exist per page',
            impact: 'Confuses assistive technologies',
            category: 'Accessibility - ARIA'
        });
        penalty += 5;
    }

    // Check for navigation landmark
    const navLandmark = $('nav, [role="navigation"]');
    if (navLandmark.length === 0) {
        issues.push({
            id: 'aria-nav-missing',
            severity: 'INFO',
            title: 'Consider Adding Navigation Landmark',
            description: 'Use <nav> or role="navigation" for navigation areas',
            impact: 'Helps screen reader users find navigation',
            category: 'Accessibility - ARIA'
        });
    }

    return { issues, penalty };
}

/**
 * Check ARIA Roles
 */
function checkRoles($) {
    const issues = [];
    let penalty = 0;

    const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
        'contentinfo', 'definition', 'dialog', 'directory', 'document',
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
        'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
        'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
        'treeitem'
    ];

    const elementsWithRoles = $('[role]');
    elementsWithRoles.each((i, el) => {
        const role = $(el).attr('role');
        if (!validRoles.includes(role)) {
            if (penalty < 5) { // Only report once
                issues.push({
                    id: 'aria-invalid-role',
                    severity: 'WARNING',
                    title: `Invalid ARIA Role: "${role}"`,
                    description: 'Use only standard ARIA roles',
                    impact: 'Assistive technologies may not recognize custom roles',
                    category: 'Accessibility - ARIA',
                    fixSuggestion: {
                        title: 'Use Standard ARIA Roles',
                        steps: [
                            'Check ARIA specification for valid roles',
                            'Common roles: button, link, navigation, main, alert',
                            'Reference: https://www.w3.org/TR/wai-aria-1.1/#role_definitions'
                        ]
                    }
                });
                penalty = 5;
            }
        }
    });

    return { issues, penalty };
}

/**
 * Check ARIA States and Properties
 */
function checkStatesAndProperties($) {
    const issues = [];
    let penalty = 0;

    // Check for required aria-labelledby references
    const ariaLabelledby = $('[aria-labelledby]');
    ariaLabelledby.each((i, el) => {
        const labelId = $(el).attr('aria-labelledby');
        if (labelId && !$(`#${labelId}`).length && penalty < 5) {
            issues.push({
                id: 'aria-labelledby-broken',
                severity: 'WARNING',
                title: 'Broken aria-labelledby Reference',
                description: `Element references non-existent ID: ${labelId}`,
                impact: 'Screen readers cannot find the label',
                category: 'Accessibility - ARIA'
            });
            penalty = 5;
        }
    });

    // Check for aria-describedby references
    const ariaDescribedby = $('[aria-describedby]');
    ariaDescribedby.each((i, el) => {
        const descId = $(el).attr('aria-describedby');
        if (descId && !$(`#${descId}`).length && penalty < 8) {
            issues.push({
                id: 'aria-describedby-broken',
                severity: 'WARNING',
                title: 'Broken aria-describedby Reference',
                description: `Element references non-existent ID: ${descId}`,
                impact: 'Screen readers cannot find the description',
                category: 'Accessibility - ARIA'
            });
            penalty = 8;
        }
    });

    // Check buttons have accessible names
    const buttons = $('button, [role="button"]');
    const buttonsWithoutName = buttons.filter((i, btn) => {
        const hasText = $(btn).text().trim().length > 0;
        const hasAriaLabel = $(btn).attr('aria-label');
        const hasAriaLabelledby = $(btn).attr('aria-labelledby');
        return !hasText && !hasAriaLabel && !hasAriaLabelledby;
    });

    if (buttonsWithoutName.length > 0) {
        issues.push({
            id: 'aria-button-no-name',
            severity: 'CRITICAL',
            title: `${buttonsWithoutName.length} Buttons Without Accessible Name`,
            description: 'Buttons must have text or aria-label',
            impact: 'Screen readers announce as "button" with no description',
            category: 'Accessibility - ARIA',
            fixSuggestion: {
                title: 'Add Accessible Name to Buttons',
                steps: [
                    'Add text inside button: <button>Submit</button>',
                    'Or add aria-label: <button aria-label="Submit form">',
                    'Icon buttons must have aria-label'
                ]
            }
        });
        penalty += 10;
    }

    return { issues, penalty };
}

/**
 * Check ARIA Live Regions
 */
function checkLiveRegions($) {
    const issues = [];
    let penalty = 0;

    // Check for status messages
    const liveRegions = $('[aria-live], [role="status"], [role="alert"]');

    // This is informational
    if (liveRegions.length === 0) {
        issues.push({
            id: 'aria-live-regions',
            severity: 'INFO',
            title: 'Consider ARIA Live Regions',
            description: 'Use aria-live for dynamic content updates',
            impact: 'Screen reader users may miss dynamic changes',
            category: 'Accessibility - ARIA',
            fixSuggestion: {
                title: 'Use ARIA Live Regions',
                steps: [
                    'For status messages: role="status" or aria-live="polite"',
                    'For urgent alerts: role="alert" or aria-live="assertive"',
                    'For loading states: aria-live="polite" aria-busy="true"',
                    'Example: <div role="status">Saved successfully!</div>'
                ]
            }
        });
    }

    return { issues, penalty };
}

module.exports = exports;
