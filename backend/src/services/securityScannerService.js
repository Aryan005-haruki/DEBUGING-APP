const sslValidator = require('./security/sslValidator');
const headerScanner = require('./security/headerScanner');
const sensitiveDataDetector = require('./security/sensitiveDataDetector');
const xssScanner = require('./security/xssScanner');
const csrfScanner = require('./security/csrfScanner');
const sqlInjectionScanner = require('./security/sqlInjectionScanner');
const authScanner = require('./security/authScanner');
const fileUploadScanner = require('./security/fileUploadScanner');

/**
 * PHASE 2: Security Scanner Service
 * Orchestrates all security scanners and aggregates results
 */

/**
 * Run comprehensive security scan on a website
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data including HTML, headers, resources
 * @returns {Promise<Object>} Aggregated security scan results
 */
exports.scanWebsiteSecurity = async (url, pageData) => {
    console.log(`🔒 Starting security scan for: ${url}`);

    const results = {
        url,
        scannedAt: new Date().toISOString(),
        scanners: {},
        issues: [],
        summary: {
            totalIssues: 0,
            critical: 0,
            warning: 0,
            overallScore: 0
        }
    };

    try {
        // Run all scanners concurrently
        const scanPromises = [
            // SSL/TLS Validation
            sslValidator.validate(url).then(result => ({
                name: 'SSL/TLS',
                result
            })).catch(err => ({
                name: 'SSL/TLS',
                result: { error: err.message, issues: [], score: null }
            })),

            // Security Headers
            Promise.resolve({
                name: 'Security Headers',
                result: headerScanner.scan(pageData.headers || {})
            }),

            // Sensitive Data Exposure
            Promise.resolve({
                name: 'Sensitive Data',
                result: sensitiveDataDetector.scan(pageData)
            }),

            // XSS Protection
            Promise.resolve({
                name: 'XSS Protection',
                result: xssScanner.scan(url, pageData)
            }),

            // CSRF Protection
            Promise.resolve({
                name: 'CSRF Protection',
                result: csrfScanner.scan(url, pageData)
            }),

            // SQL Injection
            Promise.resolve({
                name: 'SQL Injection',
                result: sqlInjectionScanner.scan(url, pageData)
            }),

            // Authentication Security
            Promise.resolve({
                name: 'Authentication',
                result: authScanner.scan(url, pageData)
            }),

            // File Upload Security
            Promise.resolve({
                name: 'File Upload',
                result: fileUploadScanner.scan(url, pageData)
            })
        ];

        const scanResults = await Promise.all(scanPromises);

        // Aggregate results
        let totalScore = 0;
        let scoreCount = 0;

        scanResults.forEach(({ name, result }) => {
            results.scanners[name] = result;

            // Collect issues
            if (result.issues && result.issues.length > 0) {
                result.issues.forEach(issue => {
                    results.issues.push({
                        ...issue,
                        scanner: name
                    });

                    if (issue.severity === 'CRITICAL') {
                        results.summary.critical++;
                    } else if (issue.severity === 'WARNING') {
                        results.summary.warning++;
                    }
                });

                results.summary.totalIssues += result.issues.length;
            }

            // Calculate average score
            if (result.score !== null && result.score !== undefined) {
                totalScore += result.score;
                scoreCount++;
            }
        });

        // Calculate overall security score
        if (scoreCount > 0) {
            results.summary.overallScore = Math.round(totalScore / scoreCount);
        }

        // Determine security grade
        const score = results.summary.overallScore;
        let grade, message;

        if (score >= 90) {
            grade = 'A';
            message = 'Excellent security posture';
        } else if (score >= 80) {
            grade = 'B';
            message = 'Good security with minor improvements needed';
        } else if (score >= 70) {
            grade = 'C';
            message = 'Adequate security but needs improvements';
        } else if (score >= 50) {
            grade = 'D';
            message = 'Poor security - multiple critical issues';
        } else {
            grade = 'F';
            message = 'Critical security vulnerabilities detected';
        }

        results.summary.grade = grade;
        results.summary.message = message;

        console.log(`✅ Security scan complete: Score ${score}/100 (Grade: ${grade})`);
        console.log(`📊 Issues: ${results.summary.critical} critical, ${results.summary.warning} warnings`);

        return results;

    } catch (error) {
        console.error('Security scan error:', error);
        throw error;
    }
};

/**
 * Quick security check (for faster analysis)
 * Only runs essential scanners: SSL, Headers, Sensitive Data
 */
exports.quickSecurityScan = async (url, pageData) => {
    console.log(`🔒 Running quick security scan for: ${url}`);

    try {
        const sslResult = await sslValidator.validate(url).catch(err => ({
            error: err.message,
            issues: [],
            score: null
        }));

        const headerResult = headerScanner.scan(pageData.headers || {});
        const sensitiveResult = sensitiveDataDetector.scan(pageData);

        const allIssues = [
            ...(sslResult.issues || []),
            ...(headerResult.issues || []),
            ...(sensitiveResult.issues || [])
        ];

        const critical = allIssues.filter(i => i.severity === 'CRITICAL').length;
        const warning = allIssues.filter(i => i.severity === 'WARNING').length;

        const scores = [sslResult.score, headerResult.score, sensitiveResult.score]
            .filter(s => s !== null && s !== undefined);

        const overallScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : 0;

        return {
            url,
            scannedAt: new Date().toISOString(),
            scanType: 'quick',
            issues: allIssues,
            summary: {
                totalIssues: allIssues.length,
                critical,
                warning,
                overallScore
            }
        };

    } catch (error) {
        console.error('Quick security scan error:', error);
        throw error;
    }
};

module.exports = exports;
