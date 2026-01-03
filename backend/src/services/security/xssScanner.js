/**
 * PHASE 2: XSS (Cross-Site Scripting) Scanner
 * Detects XSS vulnerability indicators (passive analysis)
 */

/**
 * Scan for XSS vulnerabilities
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data with HTML and headers
 * @returns {Object} Scan results
 */
exports.scan = (url, pageData) => {
    const issues = [];
    const checks = {
        csp: false,
        xssProtection: false,
        reflectedInput: false,
        unsafeHTML: false
    };

    try {
        const html = pageData.html || '';
        const headers = pageData.headers || {};

        // 1. Check for Content-Security-Policy
        const csp = headers['content-security-policy'] || headers['Content-Security-Policy'];

        if (!csp) {
            issues.push({
                id: 'xss-001',
                severity: 'CRITICAL',
                title: 'No Content Security Policy',
                description: 'Website lacks CSP header which prevents XSS attacks',
                impact: 'Attackers can inject malicious scripts without restrictions',
                category: 'XSS Protection'
            });
        } else {
            checks.csp = true;

            // Check for unsafe directives
            if (csp.includes('unsafe-inline')) {
                issues.push({
                    id: 'xss-002',
                    severity: 'WARNING',
                    title: 'CSP Allows Inline Scripts',
                    description: 'Content-Security-Policy allows unsafe-inline scripts',
                    impact: 'Inline JavaScript can execute, reducing XSS protection',
                    category: 'XSS Protection'
                });
            }

            if (csp.includes('unsafe-eval')) {
                issues.push({
                    id: 'xss-003',
                    severity: 'WARNING',
                    title: 'CSP Allows Eval',
                    description: 'Content-Security-Policy allows unsafe-eval',
                    impact: 'eval() and Function() can be exploited for code injection',
                    category: 'XSS Protection'
                });
            }
        }

        // 2. Check X-XSS-Protection header
        const xssProtection = headers['x-xss-protection'] || headers['X-XSS-Protection'];

        if (xssProtection && xssProtection !== '0') {
            checks.xssProtection = true;
        }

        // 3. Check for reflected user input patterns
        const urlParams = new URL(url).searchParams;

        for (const [key, value] of urlParams) {
            if (value && html.includes(value) && value.length > 3) {
                checks.reflectedInput = true;

                // Check if the reflection is in a dangerous context
                const dangerousPatterns = [
                    `<script>${value}`,
                    `">${value}`,
                    `'>${value}`,
                    `javascript:${value}`,
                    `onerror="${value}`,
                    `onclick="${value}`
                ];

                const isDangerous = dangerousPatterns.some(pattern =>
                    html.toLowerCase().includes(pattern.toLowerCase())
                );

                if (isDangerous) {
                    issues.push({
                        id: `xss-reflect-${issues.length}`,
                        severity: 'CRITICAL',
                        title: 'Reflected XSS Vulnerability Indicator',
                        description: `URL parameter "${key}" appears reflected in dangerous HTML context`,
                        impact: 'Attackers can craft URLs to inject malicious scripts',
                        category: 'XSS Protection'
                    });
                } else {
                    issues.push({
                        id: `xss-reflect-${issues.length}`,
                        severity: 'WARNING',
                        title: 'User Input Reflection Detected',
                        description: `URL parameter "${key}" is reflected in page content`,
                        impact: 'May be vulnerable to reflected XSS if not properly encoded',
                        category: 'XSS Protection'
                    });
                }
            }
        }

        // 4. Check for unsafe DOM manipulation patterns
        const unsafePatterns = [
            /innerHTML\s*=\s*[^;]+/gi,
            /document\.write\s*\(/gi,
            /eval\s*\(/gi,
            /setTimeout\s*\(\s*['"]/gi,
            /setInterval\s*\(\s*['"]/gi
        ];

        const scripts = pageData.resources?.js || [];
        const scriptContent = scripts.join('\n');

        for (const pattern of unsafePatterns) {
            if (pattern.test(scriptContent) || pattern.test(html)) {
                checks.unsafeHTML = true;

                issues.push({
                    id: `xss-dom-${issues.length}`,
                    severity: 'WARNING',
                    title: 'Unsafe DOM Manipulation Detected',
                    description: `Found usage of ${pattern.source} which can enable DOM-based XSS`,
                    impact: 'DOM manipulation with untrusted data can execute malicious code',
                    category: 'XSS Protection'
                });

                break; // Report once
            }
        }

        // 5. Check for missing input sanitization indicators
        if (html.includes('<form')) {
            const hasInputs = html.includes('<input') || html.includes('<textarea');

            if (hasInputs && !checks.csp) {
                issues.push({
                    id: 'xss-form-001',
                    severity: 'WARNING',
                    title: 'Forms Without XSS Protection',
                    description: 'Page has forms but lacks CSP protection',
                    impact: 'Form submissions may be vulnerable to stored XSS',
                    category: 'XSS Protection'
                });
            }
        }

        // Calculate score
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        let score = 100;
        if (!checks.csp) score -= 40;
        score -= (criticalCount * 15);
        score -= (warningCount * 8);
        score = Math.max(0, Math.round(score));

        return {
            checks,
            issues,
            score,
            summary: {
                cspPresent: checks.csp,
                reflectedInput: checks.reflectedInput,
                unsafePatternsFound: checks.unsafeHTML
            }
        };

    } catch (error) {
        console.error('XSS scan error:', error.message);
        return {
            checks,
            issues: [],
            score: null,
            error: error.message
        };
    }
};

module.exports = exports;
