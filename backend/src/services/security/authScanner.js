/**
 * PHASE 2: Authentication Scanner
 * Checks for authentication and session security issues
 */

/**
 * Scan for authentication weaknesses
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data with HTML and headers
 * @returns {Object} Scan results
 */
exports.scan = (url, pageData) => {
    const issues = [];
    const checks = {
        secureCookies: false,
        httpOnlyCookies: false,
        passwordPolicy: false,
        rateLimiting: false
    };

    try {
        const html = pageData.html || '';
        const headers = pageData.headers || {};

        // 1. Check for login forms
        const hasPasswordField = /<input[^>]*type\s*=\s*["']password["']/i.test(html);
        const hasLoginForm = /login|signin|log.in/i.test(html) && hasPasswordField;

        if (hasLoginForm) {
            // 2. Check for password policy indicators
            const passwordPolicyIndicators = [
                /password.*must.*characters/i,
                /minimum.*characters/i,
                /password.*strength/i,
                /password.*requirements/i,
                /uppercase.*lowercase.*number/i
            ];

            checks.passwordPolicy = passwordPolicyIndicators.some(pattern => pattern.test(html));

            if (!checks.passwordPolicy) {
                issues.push({
                    id: 'auth-001',
                    severity: 'WARNING',
                    title: 'No Visible Password Policy',
                    description: 'Login form does not display password requirements',
                    impact: 'Users may create weak passwords',
                    category: 'Authentication'
                });
            }

            // 3. Check for HTTPS on login form
            const urlObj = new URL(url);
            if (urlObj.protocol !== 'https:') {
                issues.push({
                    id: 'auth-002',
                    severity: 'CRITICAL',
                    title: 'Login Form Over HTTP',
                    description: 'Login form is served over insecure HTTP',
                    impact: 'Credentials can be intercepted in plain text',
                    category: 'Authentication'
                });
            }

            // 4. Check form action URL
            const formActionMatch = html.match(/<form[^>]*action\s*=\s*["']([^"']+)["'][^>]*>/i);
            if (formActionMatch) {
                const actionUrl = formActionMatch[1];
                if (actionUrl.startsWith('http://')) {
                    issues.push({
                        id: 'auth-003',
                        severity: 'CRITICAL',
                        title: 'Login Form Submits Over HTTP',
                        description: 'Login form action URL uses HTTP instead of HTTPS',
                        impact: 'Credentials transmitted without encryption',
                        category: 'Authentication'
                    });
                }
            }

            // 5. Check for autocomplete on password fields
            if (html.includes('autocomplete="off"') || html.includes("autocomplete='off'")) {
                // Good practice for sensitive fields
            } else {
                issues.push({
                    id: 'auth-004',
                    severity: 'WARNING',
                    title: 'Password Field Autocomplete Enabled',
                    description: 'Password field may have autocomplete enabled',
                    impact: 'Passwords could be stored in browser autocomplete',
                    category: 'Authentication'
                });
            }
        }

        // 6. Check session cookies
        const setCookie = headers['set-cookie'] || headers['Set-Cookie'];

        if (setCookie) {
            const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

            for (const cookie of cookies) {
                const cookieLower = cookie.toLowerCase();

                // Check if it's a session cookie
                const isSessionCookie = cookieLower.includes('session') ||
                    cookieLower.includes('auth') ||
                    cookieLower.includes('token');

                if (isSessionCookie) {
                    // Check Secure flag
                    if (cookieLower.includes('secure')) {
                        checks.secureCookies = true;
                    } else {
                        issues.push({
                            id: 'auth-005',
                            severity: 'CRITICAL',
                            title: 'Session Cookie Without Secure Flag',
                            description: 'Session cookie lacks Secure flag',
                            impact: 'Cookie can be transmitted over HTTP, vulnerable to interception',
                            category: 'Authentication'
                        });
                    }

                    // Check HttpOnly flag
                    if (cookieLower.includes('httponly')) {
                        checks.httpOnlyCookies = true;
                    } else {
                        issues.push({
                            id: 'auth-006',
                            severity: 'CRITICAL',
                            title: 'Session Cookie Without HttpOnly Flag',
                            description: 'Session cookie lacks HttpOnly flag',
                            impact: 'Cookie accessible to JavaScript, vulnerable to XSS theft',
                            category: 'Authentication'
                        });
                    }

                    // Check SameSite
                    if (!cookieLower.includes('samesite')) {
                        issues.push({
                            id: 'auth-007',
                            severity: 'WARNING',
                            title: 'Session Cookie Without SameSite',
                            description: 'Session cookie lacks SameSite attribute',
                            impact: 'Vulnerable to CSRF attacks',
                            category: 'Authentication'
                        });
                    }
                }
            }
        }

        // 7. Check for rate limiting indicators
        const rateLimitHeaders = [
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'retry-after',
            'x-rate-limit'
        ];

        checks.rateLimiting = rateLimitHeaders.some(header =>
            headers[header] || headers[header.replace(/^x-/, 'X-')]
        );

        if (hasLoginForm && !checks.rateLimiting) {
            issues.push({
                id: 'auth-008',
                severity: 'WARNING',
                title: 'No Rate Limiting Detected',
                description: 'Login endpoint lacks visible rate limiting headers',
                impact: 'Vulnerable to brute force password attacks',
                category: 'Authentication'
            });
        }

        // 8. Check for MFA/2FA indicators
        const mfaIndicators = [
            /two.factor/i,
            /2fa/i,
            /multi.factor/i,
            /mfa/i,
            /authenticator/i,
            /verification.code/i
        ];

        const hasMFA = mfaIndicators.some(pattern => pattern.test(html));

        if (hasLoginForm && !hasMFA) {
            issues.push({
                id: 'auth-009',
                severity: 'WARNING',
                title: 'No Multi-Factor Authentication',
                description: 'No evidence of 2FA/MFA options',
                impact: 'Accounts protected only by passwords are less secure',
                category: 'Authentication'
            });
        }

        // 9. Check for "Remember Me" functionality
        if (html.includes('remember') && hasLoginForm) {
            issues.push({
                id: 'auth-010',
                severity: 'WARNING',
                title: '"Remember Me" Feature Detected',
                description: 'Login form has "Remember Me" option',
                impact: 'Long-lived sessions increase risk if cookies are stolen',
                category: 'Authentication'
            });
        }

        // Calculate score
        let score = 100;
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        score -= (criticalCount * 20);
        score -= (warningCount * 8);
        score = Math.max(0, Math.round(score));

        return {
            checks,
            issues,
            score,
            summary: {
                hasLoginForm: hasLoginForm,
                secureCookies: checks.secureCookies,
                httpOnlyCookies: checks.httpOnlyCookies,
                passwordPolicyVisible: checks.passwordPolicy
            }
        };

    } catch (error) {
        console.error('Auth scan error:', error.message);
        return {
            checks,
            issues: [],
            score: null,
            error: error.message
        };
    }
};

module.exports = exports;
