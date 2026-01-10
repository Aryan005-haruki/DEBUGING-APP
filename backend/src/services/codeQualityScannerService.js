/**
 * PHASE 5: Code Quality Scanner Service
 * Orchestrates all code quality analyzers
 */

const htmlValidator = require('./quality/htmlValidator');
const cssValidator = require('./quality/cssValidator');
const jsAnalyzer = require('./quality/jsAnalyzer');
const performanceProfiler = require('./quality/performanceProfiler');
const browserCompatibility = require('./quality/browserCompatibility');

/**
 * Run comprehensive code quality analysis
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data (html, headers)
 * @returns {Promise<Object>} Code quality analysis results
 */
exports.analyzeCodeQuality = async (url, pageData) => {
    console.log(`🔍 Starting code quality analysis for: ${url}`);

    try {
        // Run all analyzers in parallel
        const [
            htmlResults,
            cssResults,
            jsResults,
            perfResults,
            compatResults
        ] = await Promise.all([
            Promise.resolve(htmlValidator.analyze(pageData)),
            Promise.resolve(cssValidator.analyze(pageData)),
            Promise.resolve(jsAnalyzer.analyze(pageData)),
            Promise.resolve(performanceProfiler.analyze(pageData)),
            Promise.resolve(browserCompatibility.analyze(pageData))
        ]);

        // Collect all issues
        const allIssues = [
            ...htmlResults.issues,
            ...cssResults.issues,
            ...jsResults.issues,
            ...perfResults.issues,
            ...compatResults.issues
        ];

        // Calculate overall code quality score (weighted)
        const overallScore = calculateOverallScore({
            htmlResults,
            cssResults,
            jsResults,
            perfResults,
            compatResults
        });

        // Count issues by severity
        const critical = allIssues.filter(i => i.severity === 'CRITICAL').length;
        const warning = allIssues.filter(i => i.severity === 'WARNING').length;
        const info = allIssues.filter(i => i.severity === 'INFO').length;

        const grade = calculateGrade(overallScore);

        console.log(`✅ Code quality analysis complete: Score ${overallScore}/100 (Grade: ${grade})`);
        console.log(`📊 Issues: ${critical} critical, ${warning} warnings, ${info} info`);

        return {
            url,
            score: overallScore,
            grade,
            analyzedAt: new Date().toISOString(),
            categories: {
                html: {
                    name: 'HTML Quality',
                    score: htmlResults.score,
                    issues: htmlResults.issues,
                    summary: htmlResults.summary
                },
                css: {
                    name: 'CSS Quality',
                    score: cssResults.score,
                    issues: cssResults.issues,
                    summary: cssResults.summary
                },
                javascript: {
                    name: 'JavaScript Quality',
                    score: jsResults.score,
                    issues: jsResults.issues,
                    summary: jsResults.summary
                },
                performance: {
                    name: 'Performance Optimization',
                    score: perfResults.score,
                    issues: perfResults.issues,
                    summary: perfResults.summary
                },
                compatibility: {
                    name: 'Browser Compatibility',
                    score: compatResults.score,
                    issues: compatResults.issues,
                    summary: compatResults.summary
                }
            },
            issues: allIssues,
            summary: {
                totalIssues: allIssues.length,
                critical,
                warning,
                info,
                overallScore,
                grade
            }
        };

    } catch (error) {
        console.error('❌ Code quality analysis error:', error);
        throw error;
    }
};

/**
 * Calculate overall code quality score (weighted average)
 */
function calculateOverallScore(results) {
    const weights = {
        htmlResults: 0.25,      // 25% - HTML foundation
        cssResults: 0.20,       // 20% - Styling quality
        jsResults: 0.25,        // 25% - JavaScript critical
        perfResults: 0.20,      // 20% - Performance important
        compatResults: 0.10     // 10% - Compatibility
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
 * Calculate grade from score
 */
function calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

module.exports = exports;
