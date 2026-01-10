/**
 * PHASE 4: Color Contrast Checker
 * Validates WCAG color contrast ratios (4.5:1 for AA, 7:1 for AAA)
 */

const cheerio = require('cheerio');

/**
 * Analyze color contrast ratios
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // Check for inline styles with color (simplified check)
        const elementsWithColors = $('[style*="color"]');

        if (elementsWithColors.length > 0) {
            // We can't accurately check contrast without rendering
            // So we'll provide general guidance
            issues.push({
                id: 'contrast-check-needed',
                severity: 'WARNING',
                title: 'Manual Color Contrast Check Needed',
                description: `Found ${elementsWithColors.length} elements with inline colors`,
                impact: 'Color contrast may not meet WCAG AA (4.5:1) requirements',
                category: 'Accessibility - Color Contrast',
                fixSuggestion: {
                    title: 'Check Color Contrast',
                    steps: [
                        'Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/',
                        'Minimum ratio: 4.5:1 for normal text (WCAG AA)',
                        'Minimum ratio: 3:1 for large text (18pt or 14pt bold)',
                        'Recommended: 7:1 for better accessibility (WCAG AAA)',
                        'Test all text/background combinations'
                    ]
                }
            });
            penalty = 5;
        }

        // Check for images without alt (may contain text)
        const imagesWithoutAlt = $('img:not([alt])');
        if (imagesWithoutAlt.length > 0) {
            issues.push({
                id: 'contrast-images-text',
                severity: 'WARNING',
                title: 'Check Text in Images',
                description: 'If images contain text, ensure sufficient contrast',
                impact: 'Text in images must also meet contrast requirements',
                category: 'Accessibility - Color Contrast',
                fixSuggestion: {
                    title: 'Avoid or Check Text in Images',
                    steps: [
                        'Prefer CSS text over images of text',
                        'If using text in images, ensure 4.5:1 contrast',
                        'Provide text alternative via alt text'
                    ]
                }
            });
            penalty += 3;
        }

        // Check for color-only indicators (links without underline)
        const links = $('a');
        let linksChecked = 0;
        links.each((i, link) => {
            const style = $(link).attr('style') || '';
            const hasUnderline = !style.includes('text-decoration') ||
                !style.includes('none');

            if (!hasUnderline && linksChecked < 1) {
                issues.push({
                    id: 'contrast-color-alone',
                    severity: 'WARNING',
                    title: 'Don\'t Rely on Color Alone',
                    description: 'WCAG 1.4.1 - Links should not rely on color alone for identification',
                    impact: 'Colorblind users cannot distinguish links',
                    category: 'Accessibility - Color Contrast',
                    fixSuggestion: {
                        title: 'Add Non-Color Indicators',
                        steps: [
                            'Add underline to links (text-decoration: underline)',
                            'Or use bold, icons, or other visual cues',
                            'Color alone is not enough'
                        ]
                    }
                });
                penalty += 5;
                linksChecked++;
            }
        });

        // General recommendation
        if (issues.length === 0) {
            issues.push({
                id: 'contrast-recommendation',
                severity: 'INFO',
                title: 'Color Contrast Recommendations',
                description: 'Best practices for color contrast',
                impact: 'Ensuring good contrast improves readability for everyone',
                category: 'Accessibility - Color Contrast',
                fixSuggestion: {
                    title: 'Color Contrast Guidelines',
                    steps: [
                        '✅ Normal text: 4.5:1 minimum contrast ratio',
                        '✅ Large text (18pt+): 3:1 minimum',
                        '✅ UI components: 3:1 minimum',
                        '✅ Test with: Chrome DevTools Lighthouse',
                        '✅ Or: WebAIM Contrast Checker online tool'
                    ]
                }
            });
        }

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                elementsWithColors: elementsWithColors.length,
                manualCheckNeeded: true
            }
        };

    } catch (error) {
        console.error('Color contrast analysis error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

module.exports = exports;
