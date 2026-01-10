/**
 * PHASE 3: SEO Scanner Service
 * Orchestrates all SEO analyzers and generates comprehensive SEO report
 */

const metaTagAnalyzer = require('./seo/metaTagAnalyzer');
const contentAnalyzer = require('./seo/contentAnalyzer');
const structureAnalyzer = require('./seo/structureAnalyzer');
const schemaValidator = require('./seo/schemaValidator');
const mobileOptimizer = require('./seo/mobileOptimizer');
const duplicateDetector = require('./seo/duplicateDetector');

/**
 * Run comprehensive SEO analysis
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data (html, headers, resources)
 * @returns {Promise<Object>} SEO analysis results
 */
exports.analyzeSEO = async (url, pageData) => {
    console.log(`🔍 Starting SEO analysis for: ${url}`);

    try {
        // Run all analyzers in parallel
        const [
            metaResults,
            contentResults,
            structureResults,
            schemaResults,
            mobileResults,
            duplicateResults
        ] = await Promise.all([
            Promise.resolve(metaTagAnalyzer.analyze(pageData)),
            Promise.resolve(contentAnalyzer.analyze(pageData)),
            Promise.resolve(structureAnalyzer.analyze({ ...pageData, url })),
            Promise.resolve(schemaValidator.analyze(pageData)),
            Promise.resolve(mobileOptimizer.analyze(pageData)),
            Promise.resolve(duplicateDetector.analyze({ ...pageData, url }))
        ]);

        // Collect all issues
        const allIssues = [
            ...metaResults.issues,
            ...contentResults.issues,
            ...structureResults.issues,
            ...schemaResults.issues,
            ...mobileResults.issues,
            ...duplicateResults.issues
        ];

        // Calculate overall score (weighted average)
        const overallScore = calculateOverallScore({
            metaResults,
            contentResults,
            structureResults,
            schemaResults,
            mobileResults,
            duplicateResults
        });

        // Count issues by severity
        const critical = allIssues.filter(i => i.severity === 'CRITICAL').length;
        const warning = allIssues.filter(i => i.severity === 'WARNING').length;
        const info = allIssues.filter(i => i.severity === 'INFO').length;

        const grade = calculateGrade(overallScore);

        console.log(`✅ SEO analysis complete: Score ${overallScore}/100 (Grade: ${grade})`);
        console.log(`📊 Issues: ${critical} critical, ${warning} warnings, ${info} info`);

        return {
            url,
            score: overallScore,
            grade,
            analyzedAt: new Date().toISOString(),
            categories: {
                metaTags: {
                    name: 'Meta Tags',
                    score: metaResults.score,
                    issues: metaResults.issues,
                    summary: metaResults.summary
                },
                content: {
                    name: 'Content Quality',
                    score: contentResults.score,
                    issues: contentResults.issues,
                    summary: contentResults.summary
                },
                structure: {
                    name: 'Page Structure',
                    score: structureResults.score,
                    issues: structureResults.issues,
                    summary: structureResults.summary
                },
                schema: {
                    name: 'Schema Markup',
                    score: schemaResults.score,
                    issues: schemaResults.issues,
                    summary: schemaResults.summary
                },
                mobile: {
                    name: 'Mobile Optimization',
                    score: mobileResults.score,
                    issues: mobileResults.issues,
                    summary: mobileResults.summary
                },
                duplicates: {
                    name: 'Duplicate Content',
                    score: duplicateResults.score,
                    issues: duplicateResults.issues,
                    summary: duplicateResults.summary
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
        console.error('❌ SEO analysis error:', error);
        throw error;
    }
};

/**
 * Calculate overall SEO score (weighted average)
 */
function calculateOverallScore(results) {
    const weights = {
        metaResults: 0.20,      // 20% - Meta tags are important
        contentResults: 0.25,    // 25% - Content is most important
        structureResults: 0.20,  // 20% - Structure matters
        schemaResults: 0.10,     // 10% - Schema is bonus
        mobileResults: 0.15,     // 15% - Mobile is critical now
        duplicateResults: 0.10   // 10% - Duplicates hurt SEO
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
 * Calculate SEO grade from score
 */
function calculateGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
}

/**
 * Quick SEO scan (subset of checks for faster analysis)
 */
exports.quickSEOScan = async (url, pageData) => {
    console.log(`⚡ Quick SEO scan for: ${url}`);

    try {
        // Run only essential analyzers
        const [metaResults, structureResults, mobileResults] = await Promise.all([
            Promise.resolve(metaTagAnalyzer.analyze(pageData)),
            Promise.resolve(structureAnalyzer.analyze({ ...pageData, url })),
            Promise.resolve(mobileOptimizer.analyze(pageData))
        ]);

        const allIssues = [
            ...metaResults.issues,
            ...structureResults.issues,
            ...mobileResults.issues
        ];

        const scores = [metaResults.score, structureResults.score, mobileResults.score];
        const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

        return {
            url,
            score: avgScore,
            grade: calculateGrade(avgScore),
            issues: allIssues,
            summary: {
                totalIssues: allIssues.length,
                critical: allIssues.filter(i => i.severity === 'CRITICAL').length,
                warning: allIssues.filter(i => i.severity === 'WARNING').length
            }
        };

    } catch (error) {
        console.error('Quick SEO scan error:', error);
        throw error;
    }
};

module.exports = exports;
