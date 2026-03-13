const fixSuggestions = require('../utils/fixSuggestions');

/**
 * Generate comprehensive website analysis report
 */
exports.generateWebsiteReport = (url, analysisResults) => {
    const { pagespeed, lighthouse, brokenLinks, security, seo, accessibility,
            dnsAudit, techStack, domainIntel, networkWaterfall, redirectChain,
            cookieAudit, mobileFriendliness, mixedContent, blacklist,
            robotsSitemap, socialPreview, imageOptimization, uptime,
            legalCompliance, structuredData, brokenImages } = analysisResults;

    const categories = [];
    const timestamp = new Date().toISOString();

    // Performance category - with fallback
    if (pagespeed?.mobile || pagespeed?.desktop || lighthouse) {
        categories.push(generatePerformanceCategory(pagespeed, lighthouse));
    } else {
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

    // SEO category - prioritize Deep Search
    if (seo) {
        categories.push(generateSEOAnalysisCategory(seo));
    } else if (pagespeed?.mobile || pagespeed?.desktop) {
        categories.push(generateStandardSeoCategory(pagespeed.mobile || pagespeed.desktop));
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

    // Accessibility category
    if (accessibility) {
        categories.push(generateDeepAccessibilityCategory(accessibility));
    } else if (pagespeed?.mobile || pagespeed?.desktop) {
        categories.push(generateStandardAccessibilityCategory(pagespeed.mobile || pagespeed.desktop));
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

    // Security category
    if (security) {
        categories.push(generateSecurityVulnerabilitiesCategory(security));
    } else {
        categories.push(generateBasicSecurityCategory(url));
    }

    // Code Quality category
    if (analysisResults.codeQuality) {
        categories.push(generateCodeQualityCategory(analysisResults.codeQuality));
    }

    // Broken Links category
    if (brokenLinks) {
        categories.push(generateBrokenLinksCategory(brokenLinks));
    }

    // ── Phase 6: New Advanced Categories ──

    // DNS & Email Security
    if (dnsAudit && dnsAudit.issues) {
        categories.push(generateGenericCategory('DNS & Email Security', dnsAudit));
    }

    // Technology Stack
    if (techStack && techStack.issues) {
        categories.push(generateGenericCategory('Technology Stack', techStack));
    }

    // Domain Intelligence
    if (domainIntel && domainIntel.issues) {
        categories.push(generateGenericCategory('Domain Intelligence', domainIntel));
    }

    // Network Performance
    if (networkWaterfall && networkWaterfall.issues) {
        categories.push(generateGenericCategory('Network Performance', networkWaterfall));
    }

    // Redirect Chain
    if (redirectChain && redirectChain.issues) {
        categories.push(generateGenericCategory('Redirect Chain', redirectChain));
    }

    // Cookie Security
    if (cookieAudit && cookieAudit.issues) {
        categories.push(generateGenericCategory('Cookie Security', cookieAudit));
    }

    // Mobile Friendliness
    if (mobileFriendliness && mobileFriendliness.issues) {
        categories.push(generateGenericCategory('Mobile Friendliness', mobileFriendliness));
    }

    // Mixed Content & Integrity
    if (mixedContent && mixedContent.issues) {
        categories.push(generateGenericCategory('Mixed Content & Integrity', mixedContent));
    }

    // Blacklist & Reputation
    if (blacklist && blacklist.issues) {
        categories.push(generateGenericCategory('Blacklist & Reputation', blacklist));
    }

    // ── Phase 7: New Categories ──

    if (robotsSitemap && robotsSitemap.issues) {
        categories.push(generateGenericCategory('Robots & Sitemap', robotsSitemap));
    }

    if (socialPreview && socialPreview.issues) {
        categories.push(generateGenericCategory('Social Media Preview', socialPreview));
    }

    if (imageOptimization && imageOptimization.issues) {
        categories.push(generateGenericCategory('Image Optimization', imageOptimization));
    }

    if (uptime && uptime.issues) {
        categories.push(generateGenericCategory('Uptime & Speed', uptime));
    }

    if (legalCompliance && legalCompliance.issues) {
        categories.push(generateGenericCategory('Legal & Compliance', legalCompliance));
    }

    if (structuredData && structuredData.issues) {
        categories.push(generateGenericCategory('Structured Data', structuredData));
    }

    if (brokenImages && brokenImages.issues) {
        categories.push(generateGenericCategory('Broken Images', brokenImages));
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
            fixSuggestion: fixSuggestions.performance.overall,
            location: { page: 'Entire website', element: 'All pages', lineHint: 'Affects overall page load speed', path: ['Home', 'All Pages', 'Performance', '⚠️ Score: ' + mobileScore + '/100'] }
        });
    } else if (mobileScore < 90) {
        issues.push({
            id: 'perf-002',
            severity: 'WARNING',
            title: 'Performance Needs Improvement',
            description: `Mobile performance score is ${mobileScore}/100 (target: 90+)`,
            impact: 'Page loads could be faster, affecting user experience',
            fixSuggestion: fixSuggestions.performance.overall,
            location: { page: 'Homepage', element: 'Page resources', lineHint: 'Measured on mobile network conditions', path: ['Home', 'Resources', 'Performance', '⚠️ Score: ' + mobileScore + '/100'] }
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
                fixSuggestion: fixSuggestions.performance[suggestionKey] || fixSuggestions.performance.overall,
                location: { page: 'Homepage', element: opp.id, lineHint: 'Detected by PageSpeed Insights', path: ['Home', 'Performance', opp.title, '⚡ ' + (opp.displayValue || 'Optimization needed')] }
            });
        });
    }

    return {
        name: 'Performance',
        score: mobileScore,
        issues
    };
}

function generateStandardSeoCategory(mobileData) {
    const issues = [];
    const seoScore = mobileData.scores?.seo || 0;

    if (seoScore < 80) {
        issues.push({
            id: 'seo-001',
            severity: seoScore < 50 ? 'CRITICAL' : 'WARNING',
            title: 'SEO Score Below Target',
            description: `SEO score is ${seoScore}/100 (target: 90+)`,
            impact: 'May affect search engine rankings and discoverability',
            fixSuggestion: fixSuggestions.seo.overall,
            location: { page: 'All pages', element: '<head> section', lineHint: 'Check meta tags and title elements', path: ['Home', '<head>', 'SEO Meta Tags', '⚠️ Score: ' + seoScore + '/100'] }
        });
    }

    return {
        name: 'SEO',
        score: seoScore,
        issues
    };
}

function generateStandardAccessibilityCategory(mobileData) {
    const issues = [];
    const a11yScore = mobileData.scores?.accessibility || 0;

    if (a11yScore < 80) {
        issues.push({
            id: 'a11y-001',
            severity: a11yScore < 60 ? 'CRITICAL' : 'WARNING',
            title: 'Accessibility Issues Detected',
            description: `Accessibility score is ${a11yScore}/100 (target: 90+)`,
            impact: 'Users with disabilities may have difficulty using the site',
            fixSuggestion: fixSuggestions.accessibility.overall,
            location: { page: 'All pages', element: 'Interactive elements', lineHint: 'Check images, buttons, and forms for accessibility attributes', path: ['Home', 'All Pages', 'Interactive Elements', '⚠️ Score: ' + a11yScore + '/100'] }
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
            const suggestionKey = getCategoryFixSuggestion(issue.category);
            const locationMap = {
                'SSL/TLS':                { element: 'HTTPS Protocol',    lineHint: 'Check SSL certificate and TLS version' },
                'Security Headers':       { element: 'HTTP Response Headers', lineHint: 'Missing in server response headers' },
                'Sensitive Data Exposure':{ element: 'HTML source / JavaScript', lineHint: 'Found in page source code' },
                'XSS Protection':         { element: 'Input fields / scripts', lineHint: 'Check inline scripts and user inputs' },
                'CSRF Protection':        { element: 'Forms', lineHint: 'Check form action endpoints' },
            };
            const loc = locationMap[issue.category] || { element: issue.category || 'Unknown', lineHint: 'Detected during security scan' };

            issues.push({
                id: issue.id || `sec-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: suggestionKey,
                location: { page: 'Entire website', element: loc.element, lineHint: loc.lineHint, path: ['Home', issue.category || 'Security', loc.element, '🔴 ' + issue.title] }
            });
        });
    }

    return {
        name: 'Security',
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

function generateBasicSecurityCategory(url) {
    const issues = [];
    const isHttps = url.toLowerCase().startsWith('https://');

    if (!isHttps) {
        issues.push({
            id: 'sec-001',
            severity: 'CRITICAL',
            title: 'Missing HTTPS',
            description: 'Site is not using HTTPS encryption',
            impact: 'Data can be intercepted, browsers show warnings, SEO penalties',
            fixSuggestion: fixSuggestions.security.https,
            location: { page: 'All pages', element: 'URL / HTTP Protocol', selector: 'http://', lineHint: 'The site URL starts with http:// instead of https://', path: ['Home', 'URL', 'Protocol', '🔴 No HTTPS'] }
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
            details: brokenLinksData.brokenLinks,
            location: {
                page: `${brokenLinksData.pagesScanned} pages scanned`,
                element: '<a href="..."> tags',
                selector: 'a[href]',
                lineHint: 'Broken links return 404 or connection errors',
                path: [
                    'Home',
                    'Page Links',
                    '<a href> Tags',
                    '🔴 ' + brokenLinksData.totalBrokenLinks + ' Broken Link' + (brokenLinksData.totalBrokenLinks > 1 ? 's' : '') + ' Found'
                ]
            }
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
            const suggestionKey = getSEOFixSuggestion(issue.category);
            const seoLocationMap = {
                'SEO - Meta Tags':  { element: '<meta> tags in <head>', selector: 'meta[name], meta[property]', lineHint: 'Found in HTML <head> section' },
                'SEO - Content':    { element: 'Page body content', selector: 'body', lineHint: 'Detected in page text content' },
                'SEO - Structure':  { element: 'Heading hierarchy', selector: 'h1, h2, h3', lineHint: 'Found in page heading structure' },
                'SEO - Schema':     { element: 'Structured data', selector: 'script[type="application/ld+json"]', lineHint: 'Missing or invalid JSON-LD schema markup' },
                'SEO - Mobile':     { element: 'Viewport / mobile config', selector: 'meta[name="viewport"]', lineHint: 'Found in <head> meta tags' },
            };
            const loc = seoLocationMap[issue.category] || { element: issue.category || 'Page', lineHint: 'Detected during SEO analysis' };

            issues.push({
                id: issue.id || `seo-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || suggestionKey,
                location: { page: 'Homepage', ...loc, path: ['Home', issue.category || 'SEO', loc.element || 'HTML', '⚠️ ' + issue.title] }
            });
        });
    }

    return {
        name: 'SEO',
        score: seoResults.score || 0,
        issues,
        summary: {
            grade: seoResults.grade,
            totalIssues: issues.length,
            critical: issues.filter(i => i.severity === 'CRITICAL').length,
            warning: issues.filter(i => i.severity === 'WARNING').length
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
function generateDeepAccessibilityCategory(a11yResults) {
    const issues = [];

    // Map all accessibility issues from all analyzers
    if (a11yResults.issues && a11yResults.issues.length > 0) {
        a11yResults.issues.forEach((issue, idx) => {
            const suggestionKey = getAccessibilityFixSuggestion(issue.category);
            const a11yLocationMap = {
                'Accessibility - Perceivable':  { element: 'Images / media', selector: 'img, video, audio', lineHint: 'Missing alternative text or captions' },
                'Accessibility - Operable':     { element: 'Interactive controls', selector: 'button, a, input', lineHint: 'Keyboard navigation or focus issues' },
                'Accessibility - Understandable': { element: 'Form elements', selector: 'input, label, select', lineHint: 'Missing labels or unclear instructions' },
                'Accessibility - Color Contrast': { element: 'Text elements', selector: 'p, h1, h2, h3, span', lineHint: 'Text color vs background contrast is too low' },
                'Accessibility - ARIA':         { element: 'ARIA attributes', selector: '[role], [aria-*]', lineHint: 'Missing or incorrect ARIA landmark roles' },
                'Accessibility - Keyboard':     { element: 'Focusable elements', selector: ':focusable', lineHint: 'Elements not reachable by keyboard Tab key' },
            };
            const loc = a11yLocationMap[issue.category] || { element: issue.category || 'Page elements', lineHint: 'Detected during accessibility audit' };

            issues.push({
                id: issue.id || `a11y-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || suggestionKey,
                location: { page: 'Homepage', ...loc, path: ['Home', issue.category || 'Accessibility', loc.element || 'Elements', '⚠️ ' + issue.title] }
            });
        });
    }

    return {
        name: 'Accessibility',
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
            const qualityLocationMap = {
                'HTML Quality':        { element: 'HTML markup', selector: 'html, body, *', lineHint: 'Found in page HTML structure' },
                'CSS Quality':         { element: 'Stylesheet / <style> tags', selector: 'link[rel="stylesheet"], style', lineHint: 'Found in CSS rules' },
                'JavaScript Quality':  { element: 'Script files / <script> tags', selector: 'script[src], script', lineHint: 'Found in JavaScript code' },
                'Performance':         { element: 'Page resources', lineHint: 'Affects overall page load performance' },
                'Browser Compatibility': { element: 'CSS / JS features', lineHint: 'Uses features not supported in all browsers' },
            };
            const loc = qualityLocationMap[issue.category] || { element: issue.category || 'Page code', lineHint: 'Detected during code quality analysis' };

            issues.push({
                id: issue.id || `quality-${idx}`,
                severity: issue.severity,
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || fixSuggestions.performance.overall,
                location: { page: 'Homepage', ...loc, path: ['Home', issue.category || 'Code Quality', loc.element || 'Source code', '⚠️ ' + issue.title] }
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

/**
 * Generic category generator for new Phase 6 scanners
 * Works for any scanner result that has { issues: [...], score, summary }
 */
function generateGenericCategory(categoryName, scannerResult) {
    const issues = [];

    if (scannerResult.issues && scannerResult.issues.length > 0) {
        scannerResult.issues.forEach((issue, idx) => {
            // Build a default fix suggestion
            const defaultFix = {
                summary: `Fix this ${issue.severity === 'CRITICAL' ? 'critical' : 'important'} ${categoryName} issue`,
                steps: [
                    `Identify the problem: ${issue.description}`,
                    `Understand the impact: ${issue.impact}`,
                    `Apply the recommended fix for "${issue.title}"`,
                    'Re-scan to verify the fix'
                ],
                resources: [`https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(issue.title)}`]
            };

            issues.push({
                id: issue.id || `${categoryName.toLowerCase().replace(/[^a-z]/g, '')}-${idx}`,
                severity: issue.severity || 'WARNING',
                title: issue.title,
                description: issue.description,
                impact: issue.impact,
                fixSuggestion: issue.fixSuggestion || defaultFix,
                location: {
                    page: 'Homepage',
                    element: issue.category || categoryName,
                    lineHint: `Detected during ${categoryName} analysis`,
                    path: ['Home', categoryName, issue.category || categoryName, (issue.severity === 'CRITICAL' ? '🔴 ' : '⚠️ ') + issue.title]
                }
            });
        });
    }

    return {
        name: categoryName,
        score: scannerResult.score != null ? scannerResult.score : undefined,
        issues,
        summary: scannerResult.summary || {
            totalIssues: issues.length,
            critical: issues.filter(i => i.severity === 'CRITICAL').length,
            warning: issues.filter(i => i.severity === 'WARNING').length
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
