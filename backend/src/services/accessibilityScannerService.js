/**
 * PHASE 4: Accessibility Scanner Service
 * Orchestrates all accessibility analyzers for WCAG 2.1 AA compliance
 */

const wcagValidator = require('./accessibility/wcagValidator');
const colorContrastChecker = require('./accessibility/colorContrastChecker');
const keyboardNavigationTest = require('./accessibility/keyboardNavigationTest');
const ariaValidator = require('./accessibility/ariaValidator');
const screenReaderTest = require('./accessibility/screenReaderTest');

/**
 * Run comprehensive accessibility analysis
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data (html, headers)
 * @returns {Promise<Object>} Accessibility analysis results
 */
exports.analyzeAccessibility = async (url, pageData) => {
    console.log(`♿ Starting accessibility analysis for: ${url}`);

    try {
        // Run all analyzers in parallel
        const [
            wcagResults,
            contrastResults,
            keyboardResults,
            ariaResults,
            screenReaderResults
        ] = await Promise.all([
            Promise.resolve(wcagValidator.analyze(pageData)),
            Promise.resolve(colorContrastChecker.analyze(pageData)),
            Promise.resolve(keyboardNavigationTest.analyze(pageData)),
            Promise.resolve(ariaValidator.analyze(pageData)),
            Promise.resolve(screenReaderTest.analyze(pageData))
        ]);

        // Collect all issues
        const allIssues = [
            ...wcagResults.issues,
            ...contrastResults.issues,
            ...keyboardResults.issues,
            ...ariaResults.issues,
            ...screenReaderResults.issues
        ];

        // Calculate overall accessibility score (weighted)
        const overallScore = calculateOverallScore({
            wcagResults,
            contrastResults,
            keyboardResults,
            ariaResults,
            screenReaderResults
        });

        // Count issues by severity
        const critical = allIssues.filter(i => i.severity === 'CRITICAL').length;
        const warning = allIssues.filter(i => i.severity === 'WARNING').length;
        const info = allIssues.filter(i => i.severity === 'INFO').length;

        const complianceLevel = determineComplianceLevel(overallScore, critical);

        console.log(`✅ Accessibility analysis complete: Score ${overallScore}/100`);
        console.log(`📊 WCAG Compliance: ${complianceLevel}`);
        console.log(`📊 Issues: ${critical} critical, ${warning} warnings, ${info} info`);

        return {
            url,
            score: overallScore,
            complianceLevel,
            analyzedAt: new Date().toISOString(),
            categories: {
                wcagCompliance: {
                    name: 'WCAG 2.1 AA Compliance',
                    score: wcagResults.score,
                    issues: wcagResults.issues,
                    summary: wcagResults.summary
                },
                colorContrast: {
                    name: 'Color Contrast',
                    score: contrastResults.score,
                    issues: contrastResults.issues,
                    summary: contrastResults.summary
                },
                keyboard: {
                    name: 'Keyboard Navigation',
                    score: keyboardResults.score,
                    issues: keyboardResults.issues,
                    summary: keyboardResults.summary
                },
                aria: {
                    name: 'ARIA Implementation',
                    score: ariaResults.score,
                    issues: ariaResults.issues,
                    summary: ariaResults.summary
                },
                screenReader: {
                    name: 'Screen Reader',
                    score: screenReaderResults.score,
                    issues: screenReaderResults.issues,
                    summary: screenReaderResults.summary
                }
            },
            issues: allIssues,
            summary: {
                totalIssues: allIssues.length,
                critical,
                warning,
                info,
                overallScore,
                complianceLevel
            }
        };

    } catch (error) {
        console.error('❌ Accessibility analysis error:', error);
        throw error;
    }
};

/**
 * Calculate overall accessibility score (weighted average)
 */
function calculateOverallScore(results) {
    const weights = {
        wcagResults: 0.30,          // 30% - Core WCAG compliance
        contrastResults: 0.15,      // 15% - Color contrast
        keyboardResults: 0.25,      // 25% - Keyboard accessibility critical
        ariaResults: 0.15,          // 15% - ARIA implementation
        screenReaderResults: 0.15   // 15% - Screen reader support
    };

    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
        const score = results[key]?.score;
        if (score !== null && score !== undefined && !isNaN(score)) {
            totalScore += score * weight;
            totalWeight += weight;
        }
    }

    return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
}

/**
 * Determine WCAG compliance level
 */
function determineComplianceLevel(score, criticalIssues) {
    if (criticalIssues > 0) {
        return 'Non-Compliant';
    }

    if (score >= 90) {
        return 'WCAG 2.1 AA Compliant';
    } else if (score >= 75) {
        return 'Partially Compliant';
    } else {
        return 'Non-Compliant';
    }
}

/**
 * Quick accessibility scan (subset for faster analysis)
 */
exports.quickAccessibilityScan = async (url, pageData) => {
    console.log(`⚡ Quick accessibility scan for: ${url}`);

    try {
        // Run only essential analyzers
        const [wcagResults, screenReaderResults] = await Promise.all([
            Promise.resolve(wcagValidator.analyze(pageData)),
            Promise.resolve(screenReaderTest.analyze(pageData))
        ]);

        const allIssues = [
            ...wcagResults.issues,
            ...screenReaderResults.issues
        ];

        const avgScore = Math.round((wcagResults.score + screenReaderResults.score) / 2);

        return {
            url,
            score: avgScore,
            complianceLevel: determineComplianceLevel(avgScore, allIssues.filter(i => i.severity === 'CRITICAL').length),
            issues: allIssues,
            summary: {
                totalIssues: allIssues.length,
                critical: allIssues.filter(i => i.severity === 'CRITICAL').length,
                warning: allIssues.filter(i => i.severity === 'WARNING').length
            }
        };

    } catch (error) {
        console.error('Quick accessibility scan error:', error);
        throw error;
    }
};

module.exports = exports;
