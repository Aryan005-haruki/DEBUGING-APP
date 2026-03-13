/**
 * Cookie & Privacy Compliance Audit Service
 * Analyzes cookies for security flags, third-party tracking, and privacy
 */

/**
 * Audit cookies from page data
 * @param {string} url - Page URL
 * @param {Object} pageData - { cookies: [...], html }
 */
exports.auditCookies = (url, pageData) => {
    console.log(`🍪 Auditing cookies for: ${url}`);

    const cookies = pageData.cookies || [];
    const html = pageData.html || '';
    const issues = [];
    const cookieDetails = [];

    const isHTTPS = url.startsWith('https://');
    const pageDomain = extractDomain(url);

    cookies.forEach((cookie, idx) => {
        const detail = {
            name: cookie.name,
            domain: cookie.domain,
            path: cookie.path || '/',
            secure: cookie.secure || false,
            httpOnly: cookie.httpOnly || false,
            sameSite: cookie.sameSite || 'None',
            expires: cookie.expires ? new Date(cookie.expires * 1000).toISOString() : 'Session',
            isThirdParty: !isDomainMatch(pageDomain, cookie.domain),
            size: (cookie.name + '=' + (cookie.value || '')).length
        };

        cookieDetails.push(detail);

        // Check Secure flag
        if (isHTTPS && !cookie.secure) {
            issues.push({
                id: `cookie-sec-${idx}`,
                severity: 'WARNING',
                title: `Cookie "${cookie.name}" Missing Secure Flag`,
                description: `Cookie "${cookie.name}" does not have the Secure flag on an HTTPS site`,
                impact: 'Cookie can be sent over insecure HTTP, exposing its value to interception',
                category: 'Cookie Security'
            });
        }

        // Check HttpOnly for session cookies
        const isSessionLike = /sess|token|auth|jwt|login|sid/i.test(cookie.name);
        if (isSessionLike && !cookie.httpOnly) {
            issues.push({
                id: `cookie-http-${idx}`,
                severity: 'CRITICAL',
                title: `Session Cookie "${cookie.name}" Not HttpOnly`,
                description: `Cookie "${cookie.name}" looks like a session cookie but is accessible via JavaScript`,
                impact: 'XSS attacks can steal this cookie and hijack user sessions',
                category: 'Cookie Security'
            });
        }

        // Check SameSite
        if (!cookie.sameSite || cookie.sameSite === 'None') {
            if (!cookie.secure) {
                issues.push({
                    id: `cookie-ss-${idx}`,
                    severity: 'WARNING',
                    title: `Cookie "${cookie.name}" SameSite=None Without Secure`,
                    description: 'SameSite=None cookies must also have Secure flag',
                    impact: 'Cookie may be blocked by modern browsers',
                    category: 'Cookie Security'
                });
            }
        }
    });

    // Third-party cookies
    const thirdPartyCookies = cookieDetails.filter(c => c.isThirdParty);
    if (thirdPartyCookies.length > 0) {
        issues.push({
            id: 'cookie-tp-001',
            severity: 'WARNING',
            title: `${thirdPartyCookies.length} Third-Party Cookies Detected`,
            description: `Found ${thirdPartyCookies.length} cookies from external domains: ${thirdPartyCookies.map(c => c.domain).slice(0, 3).join(', ')}`,
            impact: 'Third-party cookies track users across websites — privacy concern',
            category: 'Cookie Security'
        });
    }

    // Cookie consent detection
    const consentPatterns = ['cookie-consent', 'cookie-banner', 'cookies-policy', 'gdpr', 'cookie-notice', 'CookieConsent', 'onetrust'];
    const hasConsentBanner = consentPatterns.some(p => html.toLowerCase().includes(p.toLowerCase()));

    if (cookies.length > 0 && !hasConsentBanner) {
        issues.push({
            id: 'cookie-consent-001',
            severity: 'WARNING',
            title: 'No Cookie Consent Banner Detected',
            description: 'Website sets cookies but no cookie consent mechanism was found',
            impact: 'May violate GDPR/CCPA regulations — legal risk',
            category: 'Cookie Security'
        });
    }

    // Too many cookies
    if (cookies.length > 20) {
        issues.push({
            id: 'cookie-count-001',
            severity: 'WARNING',
            title: `Excessive Cookies (${cookies.length})`,
            description: `Website sets ${cookies.length} cookies (recommended: < 10)`,
            impact: 'Large cookie headers increase every request size and slow page loads',
            category: 'Cookie Security'
        });
    }

    // Score
    let score = 100;
    score -= issues.filter(i => i.severity === 'CRITICAL').length * 20;
    score -= issues.filter(i => i.severity === 'WARNING').length * 8;
    score = Math.max(0, Math.min(100, score));

    console.log(`✅ Cookie audit complete: ${cookies.length} cookies, score ${score}/100`);

    return {
        url,
        auditedAt: new Date().toISOString(),
        totalCookies: cookies.length,
        cookies: cookieDetails,
        thirdPartyCookies: thirdPartyCookies.length,
        hasConsentBanner,
        issues,
        score
    };
};

function extractDomain(url) {
    try {
        return new URL(url).hostname.replace('www.', '');
    } catch { return ''; }
}

function isDomainMatch(pageDomain, cookieDomain) {
    if (!cookieDomain) return true;
    const clean = cookieDomain.replace(/^\./, '');
    return pageDomain === clean || pageDomain.endsWith('.' + clean);
}

module.exports = exports;
