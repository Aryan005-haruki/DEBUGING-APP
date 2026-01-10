const fixSuggestions = require('../utils/fixSuggestions');

/**
 * Generate comprehensive website analysis report
 */
exports.generateWebsiteReport = (url, analysisResults) => {
    const { pagespeed, lighthouse, brokenLinks, security, seo, accessibility } = analysisResults;

    const categories = [];
    const timestamp = new Date().toISOString();

    // Performance category - with fallback
    if (pagespeed?.mobile || pagespeed?.desktop || lighthouse) {
        categories.push(generatePerformanceCategory(pagespeed, lighthouse));
    } else {
        // Fallback: Create default performance category
        categories.push({
            name: 'Performance',
            score: null,
            issues: [{
                id: 'perf-unavailable',
                severity: 'WARNING',
                title: 'Performance Analysis Unavailable',
                description: 'Unable to run PageSpeed analysis. Please try again later.',
                impact: 'Could not measure page load performance',
                fixSuggestion: fixSuggestions.performance.overall
            }]
        });
    }

    // SEO category - with fallback
    if (pagespeed?.mobile || pagespeed?.desktop) {
        categories.push(generateSeoCategory(pagespeed.mobile || pagespeed.desktop));
    } else {
        categories.push({
            name: 'SEO',
            score: null,
            issues: [{
                id: 'seo-unavailable',
                severity: 'WARNING',
                title: 'SEO Analysis Unavailable',
                description: 'Unable to analyze SEO metrics. Ensure URL is accessible.',
                impact: 'Could not verify SEO optimization',
                fixSuggestion: fixSuggestions.seo.overall
            }]
        });
    }

    // Accessibility category - with fallback
    if (pagespeed?.mobile || pagespeed?.desktop) {
        categories.push(generateAccessibilityCategory(pagespeed.mobile || pagespeed.desktop));
    } else {
        categories.push({
            name: 'Accessibility',
            score: null,
            issues: [{
                id: 'a11y-unavailable',
                severity: 'WARNING',
                title: 'Accessibility Analysis Unavailable',
                description: 'Unable to check accessibility. Manual review recommended.',
                impact: 'Could not verify WCAG compliance',
                fixSuggestion: fixSuggestions.accessibility.overall
            }]
        });
    }

    // Security category - always works
    categories.push(generateSecurityCategory(url));

    // Security Vulnerabilities category (Phase 2)
    if (security) {
        categories.push(generateSecurityVulnerabilitiesCategory(security));
    } else {
        categories.push({
            name: 'Security Vulnerabilities',
            score: null,
            issues: [{
                id: 'sec-vuln-unavailable',
                severity: 'WARNING',
                title: 'Security Scan Unavailable',
                description: 'Advanced security scanning could not be performed',
                impact: 'Some security vulnerabilities may not be detected',
                fixSuggestion: fixSuggestions.security.overall
            }]
        });
    }

    // SEO Analysis category (Phase 3) - Deep SEO Analysis
    if (analysisResults.seo) {
        categories.push(generateSEOAnalysisCategory(analysisResults.seo));
    } else {
        categories.push({
            name: 'SEO Analysis',
            score: null,
            issues: [{
                id: 'seo-analysis-unavailable',
                severity: 'WARNING',
                title: 'SEO Analysis Unavailable',
                description: 'Deep SEO analysis could not be performed',
                impact: 'Detailed SEO recommendations not available',
                fixSuggestion: fixSuggestions.seo.overall
            }]
        });
    }

    // Accessibility Compliance category (Phase 4) - WCAG 2.1 AA
    if (analysisResults.accessibility) {
        categories.push(generateAccessibilityCategory(analysisResults.accessibility));
    } else {
        categories.push({
            name: 'Accessibility Compliance',
            score: null,
            issues: [{
                id: 'a11y-deep-unavailable',
                severity: 'WARNING',
                title: 'Accessibility Analysis Unavailable',
                description: 'WCAG 2.1 AA compliance check could not be performed',
                impact: 'Detailed accessibility recommendations not available',
                fixSuggestion: fixSuggestions.accessibility.overall
            }]
        });
    }

    // Code Quality category (Phase 5) - HTML, CSS, JS, Performance, Compatibility
    if (analysisResults.codeQuality) {
        categories.push(generateCodeQualityCategory(analysisResults.codeQuality));
    } else {
        categories.push({
            name: 'Code Quality',
            score: null,
            issues: [{
                id: 'code-quality-unavailable',
                severity: 'WARNING',
                title: 'Code Quality Analysis Unavailable',
                description: 'HTML, CSS, and JavaScript quality analysis could not be performed',
                impact: 'Code quality issues may not be detected',
                fixSuggestion: fixSuggestions.codeQuality?.overall || fixSuggestions.performance.overall
            }]
        });
    }

    // Broken Links category
    if (brokenLinks) {
        categories.push(generateBrokenLinksCategory(brokenLinks));
    } else {
        categories.push({
            name: 'Broken Links',
            score: null,
            issues: [{
                id: 'links-unavailable',
                severity: 'WARNING',
                title: 'Link Check Unavailable',
                description: 'Unable to scan for broken links. Try again later.',
                impact: 'Could not verify link integrity',
                fixSuggestion: fixSuggestions.brokenLinks
            }]
        });
    }

    // Calculate summary
    const summary = calculateSummary(categories);

    return {
        url,
        analyzedAt: timestamp,
        summary,
        categories
    };
};

/**
 * Generate comprehensive APK analysis report
 */
exports.generateApkReport = (apkData) => {
    const categories = [];
    const timestamp = new Date().toISOString();

    // APK Size category
    categories.push(generateSizeCategory(apkData));

    // Permissions category
    categories.push(generatePermissionsCategory(apkData));

    // SDK Versions category
    categories.push(generateSdkCategory(apkData));

    // Calculate summary
    const summary = calculateSummary(categories);

    return {
        packageName: apkData.packageName,
        versionName: apkData.versionName,
        versionCode: apkData.versionCode,
        analyzedAt: timestamp,
        summary,
        categories
    };
};

// Helper functions for website categories

function generatePerformanceCategory(pagespeed, lighthouse) {
    const issues = [];
    const mobileScore = pagespeed?.mobile?.scores?.performance || 0;

    if (mobileScore < 50) {
        issues.push({
            id: 'perf-001',
            severity: 'CRITICAL',
            title: 'Poor Performance Score',
            description: `Mobile performance score is ${mobileScore}/100 (should be > 90)`,
            impact: 'Users experience very slow page loads, leading to high bounce rates',
            fixSuggestion: fixSuggestions.performance.overall
        });
    } else if (mobileScore < 90) {
        issues.push({
            id: 'perf-002',
            severity: 'WARNING',
            title: 'Performance Needs Improvement',
            description: `Mobile performance score is ${mobileScore}/100 (target: 90+)`,
            impact: 'Page loads could be faster, affecting user experience',
            fixSuggestion: fixSuggestions.performance.overall
        });
    }

    // Check specific metrics
    if (pagespeed?.mobile?.opportunities) {
        pagespeed.mobile.opportunities.slice(0, 5).forEach((opp, idx) => {
            const suggestionKey = opp.id.replace(/-/g, '_');
            issues.push({
                id: `perf-opp-${idx}`,
                severity: opp.score < 0.5 ? 'CRITICAL' : 'WARNING',
                title: opp.title,
                description: opp.description || opp.displayValue || 'Optimization opportunity detected',
                impact: 'Affects page load time and user experience',
                fixSuggestion: fixSuggestions.performance[suggestionKey] || fixSuggestions.performance.overall
            });
        });
    }

    return {
        name: 'Performance',
        score: mobileScore,
        issues
    };
}

function generateSeoCategory(mobileData) {
    const issues = [];
    const seoScore = mobileData.scores?.seo || 0;

    if (seoScore < 80) {
        issues.push({
            id: 'seo-001',
            severity: seoScore < 50 ? 'CRITICAL' : 'WARNING',
            title: 'SEO Score Below Target',
            description: `SEO score is ${seoScore}/100 (target: 90+)`,
            impact: 'May affect search engine rankings and discoverability',
            fixSuggestion: fixSuggestions.seo.overall
        });
    }

    return {
        name: 'SEO',
        score: seoScore,
        issues
    };
}

function generateAccessibilityCategory(mobileData) {
    const issues = [];
    const a11yScore = mobileData.scores?.accessibility || 0;

    if (a11yScore < 80) {
        issues.push({
            id: 'a11y-001',
            severity: a11yScore < 60 ? 'CRITICAL' : 'WARNING',
            title: 'Accessibility Issues Detected',
            description: `Accessibility score is ${a11yScore}/100 (target: 90+)`,
            impact: 'Users with disabilities may have difficulty using the site',
            fixSuggestion: fixSuggestions.accessibility.overall
        });
    }

    return {
        name: 'Accessibility',
        score: a11yScore,
        issues
    };
}

function generateSecurityVulnerabilitiesCategory(securityResults) {
    const issues = [];

    // Map security scanner results to report issues
    if (securityResults.issues && securityResults.issues.length > 0) {
        securityResults.issues.forEach((issue, idx) => {
            // Map category to fix suggestion
            const suggestionKey = getCategoryFixSuggestion(issue.category);

            issues.push({
                id: issue.id || `sec-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: suggestionKey
            });
        });
    }

    return {
        name: 'Security Vulnerabilities',
        score: securityResults.summary?.overallScore || 0,
        issues,
        summary: {
            grade: securityResults.summary?.grade,
            message: securityResults.summary?.message,
            critical: securityResults.summary?.critical || 0,
            warning: securityResults.summary?.warning || 0
        }
    };
}

function getCategoryFixSuggestion(category) {
    const mapping = {
        'SSL/TLS': fixSuggestions.security.ssl,
        'Security Headers': fixSuggestions.security.headers,
        'Sensitive Data Exposure': fixSuggestions.security.sensitiveData,
        'XSS Protection': fixSuggestions.security.xss,
        'CSRF Protection': fixSuggestions.security.csrf,
        'SQL Injection': fixSuggestions.security.sqlInjection,
        'Authentication': fixSuggestions.security.authentication,
        'File Upload Security': fixSuggestions.security.fileUpload
    };

    return mapping[category] || fixSuggestions.security.overall;
}

function generateSecurityCategory(url) {
    const issues = [];
    const isHttps = url.toLowerCase().startsWith('https://');

    if (!isHttps) {
        issues.push({
            id: 'sec-001',
            severity: 'CRITICAL',
            title: 'Missing HTTPS',
            description: 'Site is not using HTTPS encryption',
            impact: 'Data can be intercepted, browsers show warnings, SEO penalties',
            fixSuggestion: fixSuggestions.security.https
        });
    }

    return {
        name: 'Security',
        score: isHttps ? 100 : 0,
        issues
    };
}

function generateBrokenLinksCategory(brokenLinksData) {
    const issues = [];

    if (brokenLinksData.totalBrokenLinks > 0) {
        issues.push({
            id: 'links-001',
            severity: brokenLinksData.totalBrokenLinks > 10 ? 'CRITICAL' : 'WARNING',
            title: `${brokenLinksData.totalBrokenLinks} Broken Links Found`,
            description: `Found ${brokenLinksData.totalBrokenLinks} broken links across ${brokenLinksData.pagesScanned} pages`,
            impact: 'Poor user experience and negative SEO impact',
            fixSuggestion: fixSuggestions.brokenLinks,
            details: brokenLinksData.brokenLinks
        });
    }

    return {
        name: 'Broken Links',
        score: brokenLinksData.totalBrokenLinks === 0 ? 100 : Math.max(0, 100 - brokenLinksData.totalBrokenLinks * 5),
        issues
    };
}

/**
 * Generate SEO Analysis category (Phase 3)
 */
function generateSEOAnalysisCategory(seoResults) {
    const issues = [];

    // Map all SEO issues from all analyzers
    if (seoResults.issues && seoResults.issues.length > 0) {
        seoResults.issues.forEach((issue, idx) => {
            // Determine fix suggestion based on category
            const suggestionKey = getSEOFixSuggestion(issue.category);

            issues.push({
                id: issue.id || `seo-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || suggestionKey
            });
        });
    }

    return {
        name: 'SEO Analysis',
        score: seoResults.score || 0,
        issues,
        summary: {
            grade: seoResults.grade,
            totalIssues: seoResults.summary?.totalIssues || 0,
            critical: seoResults.summary?.critical || 0,
            warning: seoResults.summary?.warning || 0
        }
    };
}

/**
 * Get fix suggestion for SEO categories
 */
function getSEOFixSuggestion(category) {
    const mapping = {
        'SEO - Meta Tags': fixSuggestions.seo.metaTags,
        'SEO - Content': fixSuggestions.seo.content,
        'SEO - Structure': fixSuggestions.seo.structure,
        'SEO - Schema': fixSuggestions.seo.schema,
        'SEO - Mobile': fixSuggestions.seo.mobile,
        'SEO - Duplicates': fixSuggestions.seo.duplicates
    };

    return mapping[category] || fixSuggestions.seo.overall;
}

/**
 * Generate Accessibility Compliance category (Phase 4)
 */
function generateAccessibilityCategory(a11yResults) {
    const issues = [];

    // Map all accessibility issues from all analyzers
    if (a11yResults.issues && a11yResults.issues.length > 0) {
        a11yResults.issues.forEach((issue, idx) => {
            // Use issue's own fixSuggestion or get from category
            const suggestionKey = getAccessibilityFixSuggestion(issue.category);

            issues.push({
                id: issue.id || `a11y-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || suggestionKey
            });
        });
    }

    return {
        name: 'Accessibility Compliance',
        score: a11yResults.score || 0,
        issues,
        summary: {
            complianceLevel: a11yResults.complianceLevel,
            totalIssues: a11yResults.summary?.totalIssues || 0,
            critical: a11yResults.summary?.critical || 0,
            warning: a11yResults.summary?.warning || 0
        }
    };
}

/**
 * Get fix suggestion for accessibility categories
 */
function getAccessibilityFixSuggestion(category) {
    const mapping = {
        'Accessibility - Perceivable': fixSuggestions.accessibility.perceivable,
        'Accessibility - Operable': fixSuggestions.accessibility.operable,
        'Accessibility - Understandable': fixSuggestions.accessibility.understandable,
        'Accessibility - Robust': fixSuggestions.accessibility.robust,
        'Accessibility - Color Contrast': fixSuggestions.accessibility.colorContrast,
        'Accessibility - Keyboard': fixSuggestions.accessibility.keyboard,
        'Accessibility - ARIA': fixSuggestions.accessibility.aria,
        'Accessibility - Screen Reader': fixSuggestions.accessibility.screenReader
    };

    return mapping[category] || fixSuggestions.accessibility.overall;
}

// Helper functions for APK categories

function generateSizeCategory(apkData) {
    const issues = [];
    const sizeIssues = apkData.analysis.size.issues || [];

    sizeIssues.forEach((issue, idx) => {
        issues.push({
            id: `size-${idx}`,
            severity: issue.severity,
            title: 'APK Size Issue',
            description: issue.message,
            impact: issue.impact,
            fixSuggestion: fixSuggestions.apk.size
        });
    });

    return {
        name: 'APK Size',
        issues
    };
}

function generatePermissionsCategory(apkData) {
    const issues = [];
    const permIssues = apkData.analysis.permissions.issues || [];

    permIssues.forEach((issue, idx) => {
        issues.push({
            id: `perm-${idx}`,
            severity: issue.severity,
            title: 'Permission Concern',
            description: issue.message,
            impact: issue.impact,
            fixSuggestion: fixSuggestions.apk.permissions,
            details: issue.permissions
        });
    });

    return {
        name: 'Permissions',
        issues
    };
}

function generateSdkCategory(apkData) {
    const issues = [];
    const sdkIssues = apkData.analysis.sdk.issues || [];

    sdkIssues.forEach((issue, idx) => {
        issues.push({
            id: `sdk-${idx}`,
            severity: issue.severity,
            title: issue.message,
            description: issue.recommendation || issue.message,
            impact: issue.impact,
            fixSuggestion: fixSuggestions.apk.sdk
        });
    });

    return {
        name: 'SDK Versions',
        issues
    };
}

/**
 * Generate Code Quality category (Phase 5)
 */
function generateCodeQualityCategory(codeQualityResults) {
    const issues = [];

    // Map all code quality issues from all analyzers
    if (codeQualityResults.issues && codeQualityResults.issues.length > 0) {
        codeQualityResults.issues.forEach((issue, idx) => {
            issues.push({
                id: issue.id || `quality-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || fixSuggestions.performance.overall
            });
        });
    }

    return {
        name: 'Code Quality',
        score: codeQualityResults.score || 0,
        issues,
        summary: {
            grade: codeQualityResults.grade,
            totalIssues: codeQualityResults.summary?.totalIssues || 0,
            critical: codeQualityResults.summary?.critical || 0,
            warning: codeQualityResults.summary?.warning || 0,
            categories: {
                html: codeQualityResults.categories?.html?.score,
                css: codeQualityResults.categories?.css?.score,
                javascript: codeQualityResults.categories?.javascript?.score,
                performance: codeQualityResults.categories?.performance?.score,
                compatibility: codeQualityResults.categories?.compatibility?.score
            }
        }
    };
}

function calculateSummary(categories) {
    let critical = 0;
    let warning = 0;
    let passed = 0;

    categories.forEach(category => {
        if (category.issues && category.issues.length > 0) {
            category.issues.forEach(issue => {
                if (issue.severity === 'CRITICAL') {
                    critical++;
                } else if (issue.severity === 'WARNING') {
                    warning++;
                }
            });
        } else if (category.score >= 90) {
            passed++;
        }
    });

    // Count categories with no issues as passed
    const categoriesWithNoIssues = categories.filter(c => !c.issues || c.issues.length === 0).length;
    passed += categoriesWithNoIssues;

    return { critical, warning, passed };
}

module.exports = exports;
