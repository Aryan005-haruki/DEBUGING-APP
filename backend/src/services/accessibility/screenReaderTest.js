/**
 * PHASE 4: Screen Reader Test
 * Tests screen reader accessibility (alt text, labels, semantic HTML)
 */

const cheerio = require('cheerio');

/**
 * Test screen reader accessibility
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Test results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // 1. Alt text for images
        const altTextAnalysis = checkAltText($);
        issues.push(...altTextAnalysis.issues);
        penalty += altTextAnalysis.penalty;

        // 2. Form labels
        const labelsAnalysis = checkFormLabels($);
        issues.push(...labelsAnalysis.issues);
        penalty += labelsAnalysis.penalty;

        // 3. Semantic HTML
        const semanticAnalysis = checkSemanticHTML($);
        issues.push(...semanticAnalysis.issues);
        penalty += semanticAnalysis.penalty;

        // 4. Headings structure
        const headingsAnalysis = checkHeadingsStructure($);
        issues.push(...headingsAnalysis.issues);
        penalty += headingsAnalysis.penalty;

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                images: $('img').length,
                imagesWithAlt: $('img[alt]').length,
                formFields: $('input, select, textarea').length,
                headings: $('h1, h2, h3, h4, h5, h6').length
            }
        };

    } catch (error) {
        console.error('Screen reader test error:', error.message);
        return { score: 0, issues: [], error: error.message };
    }
};

/**
 * Check alt text for images
 */
function checkAltText($) {
    const issues = [];
    let penalty = 0;

    const images = $('img');
    const imagesWithoutAlt = images.filter((i, img) => !$(img).attr('alt'));

    if (imagesWithoutAlt.length > 0) {
        issues.push({
            id: 'screenreader-alt-missing',
            severity: 'CRITICAL',
            title: `${imagesWithoutAlt.length} Images Without Alt Text`,
            description: 'Screen readers cannot describe these images',
            impact: 'Blind users miss important visual information',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Add Alt Text to All Images',
                steps: [
                    'Add alt="" to every <img> tag',
                    'Describe what the image shows',
                    'Be concise but meaningful',
                    'Use alt="" (empty) for decorative images',
                    'Don\'t start with "image of"'
                ]
            }
        });
        penalty = imagesWithoutAlt.length > 5 ? 20 : 15;
    }

    // Check for redundant alt text
    const redundantAlt = images.filter((i, img) => {
        const alt = $(img).attr('alt') || '';
        return alt.toLowerCase().startsWith('image of') ||
            alt.toLowerCase().startsWith('picture of');
    });

    if (redundantAlt.length > 0) {
        issues.push({
            id: 'screenreader-alt-redundant',
            severity: 'WARNING',
            title: 'Redundant Alt Text Detected',
            description: 'Don\'t start alt text with "image of" or "picture of"',
            impact: 'Screen readers already announce it\'s an image',
            category: 'Accessibility - Screen Reader'
        });
        penalty += 3;
    }

    return { issues, penalty };
}

/**
 * Check form labels
 */
function checkFormLabels($) {
    const issues = [];
    let penalty = 0;

    const formFields = $('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
    const fieldsWithoutLabels = formFields.filter((i, field) => {
        const id = $(field).attr('id');
        const hasLabel = id && $(`label[for="${id}"]`).length > 0;
        const hasAriaLabel = $(field).attr('aria-label');
        const hasAriaLabelledby = $(field).attr('aria-labelledby');
        return !hasLabel && !hasAriaLabel && !hasAriaLabelledby;
    });

    if (fieldsWithoutLabels.length > 0) {
        issues.push({
            id: 'screenreader-labels-missing',
            severity: 'CRITICAL',
            title: `${fieldsWithoutLabels.length} Form Fields Without Labels`,
            description: 'Screen readers cannot identify field purpose',
            impact: 'Blind users don\'t know what to enter',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Add Labels to Form Fields',
                steps: [
                    'Use <label for="fieldId">Label</label>',
                    'Or add aria-label="Label text"',
                    'Or use aria-labelledby to reference label ID',
                    'Placeholder is NOT a replacement for label'
                ]
            }
        });
        penalty = fieldsWithoutLabels.length > 3 ? 20 : 15;
    }

    return { issues, penalty };
}

/**
 * Check semantic HTML usage
 */
function checkSemanticHTML($) {
    const issues = [];
    let penalty = 0;

    // Check for semantic elements
    const hasMain = $('main').length > 0;
    const hasNav = $('nav').length > 0;
    const hasHeader = $('header').length > 0;
    const hasFooter = $('footer').length > 0;

    let missingElements = [];
    if (!hasMain) missingElements.push('<main>');
    if (!hasNav) missingElements.push('<nav>');
    if (!hasHeader) missingElements.push('<header>');
    if (!hasFooter) missingElements.push('<footer>');

    if (missingElements.length >= 3) {
        issues.push({
            id: 'screenreader-semantic-html',
            severity: 'WARNING',
            title: 'Use Semantic HTML Elements',
            description: `Missing: ${missingElements.join(', ')}`,
            impact: 'Screen readers rely on semantic structure for navigation',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Use HTML5 Semantic Elements',
                steps: [
                    'Use <main> for main content',
                    'Use <nav> for navigation',
                    'Use <header> for page header',
                    'Use <footer> for page footer',
                    'Use <article>, <section>, <aside> appropriately'
                ]
            }
        });
        penalty = 10;
    }

    // Check divitis (excessive div usage)
    const divCount = $('div').length;
    const totalElements = $('*').length;
    const divRatio = totalElements > 0 ? divCount / totalElements : 0;

    if (divRatio > 0.4) {
        issues.push({
            id: 'screenreader-divitis',
            severity: 'INFO',
            title: 'Excessive Div Usage ("Divitis")',
            description: `${Math.round(divRatio * 100)}% of elements are divs`,
            impact: 'Consider using semantic HTML instead',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Replace Divs with Semantic Elements',
                steps: [
                    'Use <article>, <section>, <aside> instead of divs',
                    'Use <nav> for navigation blocks',
                    'Use <figure> and <figcaption> for images',
                    'Semantic HTML helps screen readers understand structure'
                ]
            }
        });
    }

    return { issues, penalty };
}

/**
 * Check headings structure
 */
function checkHeadingsStructure($) {
    const issues = [];
    let penalty = 0;

    // Check H1
    const h1Count = $('h1').length;
    if (h1Count === 0) {
        issues.push({
            id: 'screenreader-no-h1',
            severity: 'CRITICAL',
            title: 'Missing H1 Heading',
            description: 'Every page should have exactly one H1',
            impact: 'Screen readers use H1 to identify main page topic',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Add H1 Heading',
                steps: [
                    'Add one <h1> tag to the page',
                    'Should describe the main page content',
                    'Place near the top of the page',
                    'Only one H1 per page'
                ]
            }
        });
        penalty = 15;
    } else if (h1Count > 1) {
        issues.push({
            id: 'screenreader-multiple-h1',
            severity: 'WARNING',
            title: `${h1Count} H1 Headings Found`,
            description: 'Should have only one H1 per page',
            impact: 'Confuses document outline for screen readers',
            category: 'Accessibility - Screen Reader'
        });
        penalty = 8;
    }

    // Check heading hierarchy
    const headings = $('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    let skippedLevels = false;

    headings.each((i, heading) => {
        const currentLevel = parseInt(heading.tagName.charAt(1));
        if (currentLevel - previousLevel > 1) {
            skippedLevels = true;
        }
        previousLevel = currentLevel;
    });

    if (skippedLevels) {
        issues.push({
            id: 'screenreader-heading-skip',
            severity: 'WARNING',
            title: 'Heading Levels Skipped',
            description: 'Don\'t skip heading levels (H1 → H3)',
            impact: 'Screen readers expect logical heading hierarchy',
            category: 'Accessibility - Screen Reader',
            fixSuggestion: {
                title: 'Maintain Heading Hierarchy',
                steps: [
                    'Use headings in order: H1 → H2 → H3',
                    'Don\'t skip levels (H1 should not jump to H3)',
                    'It\'s okay to go back up (H3 → H2)',
                    'Use CSS for visual styling, not heading level'
                ]
            }
        });
        penalty += 5;
    }

    return { issues, penalty };
}

module.exports = exports;
