/**
 * PHASE 2: CSRF (Cross-Site Request Forgery) Scanner
 * Checks for CSRF protection mechanisms (passive analysis)
 */

/**
 * Scan for CSRF protection
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data with HTML and headers
 * @returns {Object} Scan results
 */
exports.scan = (url, pageData) => {
    const issues = [];
    const checks = {
        csrfTokens: false,
        sameSiteCookies: false,
        customHeaders: false
    };

    try {
        const html = pageData.html || '';
        const headers = pageData.headers || {};

        // 1. Check for CSRF tokens in forms
        const formCount = (html.match(/<form/gi) || []).length;

        if (formCount > 0) {
            // Look for common CSRF token patterns
            const csrfPatterns = [
                /csrf[_-]?token/i,
                /xsrf[_-]?token/i,
                /_token/i,
                /authenticity[_-]?token/i,
                /__RequestVerificationToken/i
            ];

            const hasCSRFToken = csrfPatterns.some(pattern => pattern.test(html));

            if (hasCSRFToken) {
                checks.csrfTokens = true;
            } else {
                issues.push({
                    id: 'csrf-001',
                    severity: 'CRITICAL',
                    title: 'Missing CSRF Tokens',
                    description: `Found ${formCount} form(s) without visible CSRF protection tokens`,
                    impact: 'Forms vulnerable to Cross-Site Request Forgery attacks',
                    category: 'CSRF Protection',
                    details: {
                        formCount: formCount
                    }
                });
            }

            // Check for POST forms specifically
            const postForms = (html.match(/method\s*=\s*["']post["']/gi) || []).length;

            if (postForms > 0 && !hasCSRFToken) {
                issues.push({
                    id: 'csrf-002',
                    severity: 'CRITICAL',
                    title: 'POST Forms Without CSRF Protection',
                    description: `Found ${postForms} POST form(s) without CSRF tokens`,
                    impact: 'State-changing operations can be forged by attackers',
                    category: 'CSRF Protection'
                });
            }
        }

        // 2. Check for SameSite cookie attribute
        const setCookie = headers['set-cookie'] || headers['Set-Cookie'];

        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

            let hasSameSite = false;
            let hasInsecureCookie = false;

            for (const cookie of cookies) {
                if (cookie.toLowerCase().includes('samesite=')) {
                    hasSameSite = true;
                    checks.sameSiteCookies = true;
                } else if (cookie.toLowerCase().includes('session') ||
                    cookie.toLowerCase().includes('auth')) {
                    hasInsecureCookie = true;
                }
            }

            if (hasInsecureCookie && !hasSameSite) {
                issues.push({
                    id: 'csrf-003',
                    severity: 'WARNING',
                    title: 'Cookies Without SameSite Attribute',
                    description: 'Session/auth cookies lack SameSite attribute',
                    impact: 'Cookies can be sent in cross-site requests, enabling CSRF',
                    category: 'CSRF Protection'
                });
            }
        }

        // 3. Check for custom anti-CSRF headers
        const customHeaders = [
            'x-csrf-token',
            'x-xsrf-token',
            'x-requested-with'
        ];

        // Note: We can't detect request headers easily, but we can check meta tags
        const hasCSRFMetaTag = customHeaders.some(header =>
            html.toLowerCase().includes(`name="${header}"`) ||
            html.toLowerCase().includes(`name='${header}'`)
        );

        if (hasCSRFMetaTag) {
            checks.customHeaders = true;
        }

        // 4. Check for AJAX protection patterns
        if (html.includes('XMLHttpRequest') || html.includes('fetch(')) {
            const hasXRequestedWith = html.includes('X-Requested-With');
            const hasCustomCSRFHeader = customHeaders.some(h => html.includes(h));

            if (!hasXRequestedWith && !hasCustomCSRFHeader && !checks.csrfTokens) {
                issues.push({
                    id: 'csrf-004',
                    severity: 'WARNING',
                    title: 'AJAX Requests Without CSRF Headers',
                    description: 'Page makes AJAX requests but lacks CSRF header protection',
                    impact: 'AJAX state-changing requests may be vulnerable to CSRF',
                    category: 'CSRF Protection'
                });
            }
        }

        // 5. Check for Double Submit Cookie pattern
        const hasDoubleSubmit = html.match(/cookie.*csrf/i) || html.match(/csrf.*cookie/i);
        if (hasDoubleSubmit) {
            checks.csrfTokens = true; // Double submit is a valid CSRF protection
        }

        // Calculate score
        let score = 0;
        if (checks.csrfTokens) score += 50;
        if (checks.sameSiteCookies) score += 30;
        if (checks.customHeaders) score += 20;

        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        score -= (criticalCount * 20);
        score -= (warningCount * 10);
        score = Math.max(0, Math.min(100, score));

        return {
            checks,
            issues,
            score,
            summary: {
                formsFound: formCount,
                csrfTokensPresent: checks.csrfTokens,
                sameSiteCookies: checks.sameSiteCookies
            }
        };

    } catch (error) {
        console.error('CSRF scan error:', error.message);
        return {
            checks,
            issues: [],
            score: null,
            error: error.message
        };
    }
};

module.exports = exports;
