/**
 * PHASE 2: Security Headers Scanner
 * Analyzes HTTP security headers
 */

/**
 * Scan security headers
 * @param {Object} headers - HTTP response headers
 * @returns {Object} Scan results with issues
 */
exports.scan = (headers) => {
    const issues = [];
    const headerChecks = {
        csp: false,
        xFrameOptions: false,
        xContentType: false,
        hsts: false,
        xssProtection: false,
        referrerPolicy: false,
        permissionsPolicy: false
    };

    // Normalize header keys to lowercase
    const normalizedHeaders = {};
    for (const [key, value] of Object.entries(headers)) {
        normalizedHeaders[key.toLowerCase()] = value;
    }

    // 1. Content-Security-Policy (CSP)
    if (normalizedHeaders['content-security-policy']) {
        headerChecks.csp = true;
        const csp = normalizedHeaders['content-security-policy'];

        // Check for unsafe-inline
        if (csp.includes('unsafe-inline')) {
            issues.push({
                id: 'header-001',
                severity: 'WARNING',
                title: 'Weak Content Security Policy',
                description: 'CSP allows unsafe-inline which reduces XSS protection',
                impact: 'Inline scripts can execute, lowering security',
                category: 'Security Headers'
            });
        }

        // Check for unsafe-eval
        if (csp.includes('unsafe-eval')) {
            issues.push({
                id: 'header-002',
                severity: 'WARNING',
                title: 'CSP Allows Eval',
                description: 'CSP allows unsafe-eval which can enable code injection',
                impact: 'eval() and similar functions can be exploited',
                category: 'Security Headers'
            });
        }
    } else {
        issues.push({
            id: 'header-003',
            severity: 'CRITICAL',
            title: 'Missing Content-Security-Policy',
            description: 'No Content-Security-Policy header found',
            impact: 'No protection against XSS, clickjacking, and code injection attacks',
            category: 'Security Headers'
        });
    }

    // 2. X-Frame-Options
    if (normalizedHeaders['x-frame-options']) {
        headerChecks.xFrameOptions = true;
        const xfo = normalizedHeaders['x-frame-options'].toUpperCase();

        if (xfo === 'ALLOW-FROM') {
            issues.push({
                id: 'header-004',
                severity: 'WARNING',
                title: 'Deprecated X-Frame-Options Value',
                description: 'ALLOW-FROM is deprecated, use CSP frame-ancestors instead',
                impact: 'May not work in modern browsers',
                category: 'Security Headers'
            });
        }
    } else {
        issues.push({
            id: 'header-005',
            severity: 'CRITICAL',
            title: 'Missing X-Frame-Options',
            description: 'No X-Frame-Options header found',
            impact: 'Website can be embedded in iframes, vulnerable to clickjacking',
            category: 'Security Headers'
        });
    }

    // 3. X-Content-Type-Options
    if (normalizedHeaders['x-content-type-options']) {
        headerChecks.xContentType = true;
    } else {
        issues.push({
            id: 'header-006',
            severity: 'WARNING',
            title: 'Missing X-Content-Type-Options',
            description: 'No X-Content-Type-Options: nosniff header found',
            impact: 'Browsers may incorrectly interpret file types, enabling XSS',
            category: 'Security Headers'
        });
    }

    // 4. Strict-Transport-Security (HSTS)
    if (normalizedHeaders['strict-transport-security']) {
        headerChecks.hsts = true;
        const hsts = normalizedHeaders['strict-transport-security'];

        // Extract max-age
        const maxAgeMatch = hsts.match(/max-age=(\d+)/);
        if (maxAgeMatch) {
            const maxAge = parseInt(maxAgeMatch[1]);
            const oneYear = 31536000; // seconds

            if (maxAge < oneYear) {
                issues.push({
                    id: 'header-007',
                    severity: 'WARNING',
                    title: 'Weak HSTS Max-Age',
                    description: `HSTS max-age is ${maxAge} seconds (recommended: 31536000+)`,
                    impact: 'HSTS protection expires too quickly',
                    category: 'Security Headers'
                });
            }
        }

        // Check for includeSubDomains
        if (!hsts.includes('includeSubDomains')) {
            issues.push({
                id: 'header-008',
                severity: 'WARNING',
                title: 'HSTS Without includeSubDomains',
                description: 'HSTS header missing includeSubDomains directive',
                impact: 'Subdomains are not protected by HSTS',
                category: 'Security Headers'
            });
        }
    } else {
        issues.push({
            id: 'header-009',
            severity: 'CRITICAL',
            title: 'Missing HSTS Header',
            description: 'No Strict-Transport-Security header found',
            impact: 'Users can be downgraded to insecure HTTP connections',
            category: 'Security Headers'
        });
    }

    // 5. X-XSS-Protection (mostly legacy, but still checked)
    if (normalizedHeaders['x-xss-protection']) {
        headerChecks.xssProtection = true;
        const xss = normalizedHeaders['x-xss-protection'];

        if (xss === '0') {
            issues.push({
                id: 'header-010',
                severity: 'WARNING',
                title: 'XSS Protection Disabled',
                description: 'X-XSS-Protection header is set to 0 (disabled)',
                impact: 'Browser XSS filter is disabled',
                category: 'Security Headers'
            });
        }
    }

    // 6. Referrer-Policy
    if (normalizedHeaders['referrer-policy']) {
        headerChecks.referrerPolicy = true;
        const policy = normalizedHeaders['referrer-policy'];

        if (policy === 'unsafe-url' || policy === 'no-referrer-when-downgrade') {
            issues.push({
                id: 'header-011',
                severity: 'WARNING',
                title: 'Weak Referrer Policy',
                description: `Referrer-Policy "${policy}" may leak sensitive URLs`,
                impact: 'Full URLs including query parameters sent to third parties',
                category: 'Security Headers'
            });
        }
    } else {
        issues.push({
            id: 'header-012',
            severity: 'WARNING',
            title: 'Missing Referrer-Policy',
            description: 'No Referrer-Policy header found',
            impact: 'Referrer information may leak to external sites',
            category: 'Security Headers'
        });
    }

    // 7. Permissions-Policy (formerly Feature-Policy)
    if (normalizedHeaders['permissions-policy'] || normalizedHeaders['feature-policy']) {
        headerChecks.permissionsPolicy = true;
    } else {
        issues.push({
            id: 'header-013',
            severity: 'WARNING',
            title: 'Missing Permissions-Policy',
            description: 'No Permissions-Policy header found',
            impact: 'Cannot control browser features like camera, microphone, geolocation',
            category: 'Security Headers'
        });
    }

    // Calculate score
    const totalHeaders = Object.keys(headerChecks).length;
    const presentHeaders = Object.values(headerChecks).filter(v => v).length;
    const criticalIssues = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningIssues = issues.filter(i => i.severity === 'WARNING').length;

    let score = (presentHeaders / totalHeaders) * 100;
    score -= (criticalIssues * 15);
    score -= (warningIssues * 5);
    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
        headerChecks,
        issues,
        score,
        summary: {
            total: totalHeaders,
            present: presentHeaders,
            missing: totalHeaders - presentHeaders
        }
    };
};

module.exports = exports;
