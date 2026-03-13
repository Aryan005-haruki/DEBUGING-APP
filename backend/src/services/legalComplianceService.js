/**
 * Legal & Compliance Checker
 * Checks for Privacy Policy, Terms of Service, GDPR, Cookie consent
 */
const cheerio = require('cheerio');

function analyzeLegalCompliance(targetUrl, pageData) {
    const issues = [];
    let score = 100;
    const html = pageData?.html || '';
    const $ = cheerio.load(html);
    const allText = html.toLowerCase();
    const allLinks = [];

    $('a').each((i, el) => {
        const href = $(el).attr('href') || '';
        const text = $(el).text().toLowerCase().trim();
        allLinks.push({ href: href.toLowerCase(), text });
    });

    // ── 1. Privacy Policy ──
    const hasPrivacy = allLinks.some(l =>
        l.text.includes('privacy') || l.href.includes('privacy')
    );
    if (!hasPrivacy) {
        issues.push({
            id: 'legal-no-privacy',
            severity: 'CRITICAL',
            title: 'No Privacy Policy Link Found',
            description: 'No link to a Privacy Policy page was detected. A privacy policy is legally required in most countries if you collect any user data.',
            impact: 'Legal risk — violates GDPR, CCPA, and other data protection laws',
            category: 'Privacy'
        });
        score -= 25;
    }

    // ── 2. Terms of Service ──
    const hasTerms = allLinks.some(l =>
        l.text.includes('terms') || l.href.includes('terms') ||
        l.text.includes('tos') || l.href.includes('tos') ||
        l.text.includes('conditions') || l.href.includes('conditions')
    );
    if (!hasTerms) {
        issues.push({
            id: 'legal-no-terms',
            severity: 'WARNING',
            title: 'No Terms of Service Link Found',
            description: 'No Terms of Service / Terms & Conditions link found. This is recommended for any website that offers services.',
            impact: 'Users have no legal agreement — increases liability risk',
            category: 'Legal'
        });
        score -= 15;
    }

    // ── 3. Cookie Consent Banner ──
    const hasCookieBanner = allText.includes('cookie') && (
        allText.includes('consent') || allText.includes('accept') ||
        allText.includes('agree') || allText.includes('banner')
    );
    const hasCookieScript = allText.includes('cookieconsent') || allText.includes('cookie-notice') ||
        allText.includes('gdpr') || allText.includes('onetrust') || allText.includes('cookiebot');

    if (!hasCookieBanner && !hasCookieScript) {
        // Check if site uses cookies first
        const setCookie = pageData?.headers?.['set-cookie'];
        if (setCookie) {
            issues.push({
                id: 'legal-no-cookie-consent',
                severity: 'WARNING',
                title: 'No Cookie Consent Mechanism',
                description: 'Website sets cookies but no cookie consent banner or mechanism was detected.',
                impact: 'Violates GDPR/ePrivacy directive in EU — potential fines',
                category: 'GDPR'
            });
            score -= 15;
        }
    }

    // ── 4. Contact Information ──
    const hasContact = allLinks.some(l =>
        l.text.includes('contact') || l.href.includes('contact') ||
        l.text.includes('support') || l.href.includes('support')
    );
    if (!hasContact) {
        issues.push({
            id: 'legal-no-contact',
            severity: 'WARNING',
            title: 'No Contact Page Link Found',
            description: 'No link to a Contact page was found. Users need a way to reach you for support and legal inquiries.',
            impact: 'Reduces trust — users cannot reach you for issues',
            category: 'Trust'
        });
        score -= 10;
    }

    // ── 5. Copyright Notice ──
    const hasCopyright = allText.includes('©') || allText.includes('copyright') ||
        allText.includes('all rights reserved');
    if (!hasCopyright) {
        issues.push({
            id: 'legal-no-copyright',
            severity: 'WARNING',
            title: 'No Copyright Notice',
            description: 'No copyright symbol (©) or "All rights reserved" text found on the page.',
            impact: 'Minor legal protection gap — implicit copyright still applies',
            category: 'Legal'
        });
        score -= 5;
    }

    // ── 6. Accessibility Statement ──
    const hasA11yStatement = allLinks.some(l =>
        l.text.includes('accessibility') || l.href.includes('accessibility')
    );
    if (!hasA11yStatement) {
        issues.push({
            id: 'legal-no-a11y-statement',
            severity: 'WARNING',
            title: 'No Accessibility Statement',
            description: 'No accessibility statement link found. Many jurisdictions require public-facing websites to provide one.',
            impact: 'May not comply with ADA/Section 508 requirements',
            category: 'Accessibility'
        });
        score -= 5;
    }

    return { score: Math.max(0, score), issues, summary: { totalIssues: issues.length } };
}

module.exports = { analyzeLegalCompliance };
