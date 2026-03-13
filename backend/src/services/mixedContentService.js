const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Mixed Content & Subresource Integrity (SRI) Check Service
 * Detects insecure resources on HTTPS pages + missing SRI on CDN scripts
 */

/**
 * Check for mixed content and SRI issues
 */
exports.checkMixedContent = (url, pageData) => {
    console.log(`🔒 Checking mixed content for: ${url}`);

    const html = pageData.html || '';
    const $ = cheerio.load(html);
    const isHTTPS = url.startsWith('https://');
    const issues = [];
    const mixedResources = [];

    if (!isHTTPS) {
        // Entire site is HTTP — already a bigger problem
        issues.push({
            id: 'mixed-000',
            severity: 'CRITICAL',
            title: 'Entire Site Uses HTTP',
            description: 'The website does not use HTTPS at all',
            impact: 'All data is transmitted in plaintext — passwords, forms, everything',
            category: 'Mixed Content & Integrity'
        });

        return {
            url,
            checkedAt: new Date().toISOString(),
            isHTTPS: false,
            mixedContent: [],
            issues,
            score: 0
        };
    }

    // ── 1. Check all resource URLs for http:// ──

    // Scripts
    $('script[src]').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http://')) {
            mixedResources.push({ type: 'Script', url: src, element: '<script>' });
        }
    });

    // Stylesheets
    $('link[rel="stylesheet"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.startsWith('http://')) {
            mixedResources.push({ type: 'Stylesheet', url: href, element: '<link>' });
        }
    });

    // Images
    $('img[src]').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http://')) {
            mixedResources.push({ type: 'Image', url: src, element: '<img>' });
        }
    });

    // Iframes
    $('iframe[src]').each((i, el) => {
        const src = $(el).attr('src');
        if (src && src.startsWith('http://')) {
            mixedResources.push({ type: 'Iframe', url: src, element: '<iframe>' });
        }
    });

    // Forms with HTTP action
    $('form[action]').each((i, el) => {
        const action = $(el).attr('action');
        if (action && action.startsWith('http://')) {
            mixedResources.push({ type: 'Form Action', url: action, element: '<form>' });
            issues.push({
                id: 'mixed-form-001',
                severity: 'CRITICAL',
                title: 'Form Submits Over HTTP',
                description: `Form action points to insecure URL: ${action}`,
                impact: 'User data (passwords, personal info) sent in plaintext',
                category: 'Mixed Content & Integrity'
            });
        }
    });

    if (mixedResources.length > 0) {
        const scriptsMixed = mixedResources.filter(r => r.type === 'Script').length;
        const otherMixed = mixedResources.length - scriptsMixed;

        if (scriptsMixed > 0) {
            issues.push({
                id: 'mixed-001',
                severity: 'CRITICAL',
                title: `${scriptsMixed} Scripts Loaded Over HTTP`,
                description: `HTTPS page loads ${scriptsMixed} JavaScript files over insecure HTTP`,
                impact: 'Attackers can modify JavaScript in transit — complete page takeover possible',
                category: 'Mixed Content & Integrity'
            });
        }

        if (otherMixed > 0) {
            issues.push({
                id: 'mixed-002',
                severity: 'WARNING',
                title: `${otherMixed} Resources Over HTTP`,
                description: `HTTPS page loads ${otherMixed} resources (images, CSS, iframes) over HTTP`,
                impact: 'Browser may block these resources or show "Not Secure" warnings',
                category: 'Mixed Content & Integrity'
            });
        }
    }

    // ── 2. Subresource Integrity (SRI) Check ──
    let cdnScriptsWithoutSRI = 0;
    let cdnScriptsTotal = 0;

    $('script[src]').each((i, el) => {
        const src = $(el).attr('src') || '';
        const integrity = $(el).attr('integrity');

        // Only check CDN / third-party scripts
        try {
            const scriptDomain = new URL(src, url).hostname;
            const pageDomain = new URL(url).hostname;
            if (scriptDomain !== pageDomain) {
                cdnScriptsTotal++;
                if (!integrity) {
                    cdnScriptsWithoutSRI++;
                }
            }
        } catch { /* skip invalid URLs */ }
    });

    if (cdnScriptsWithoutSRI > 0) {
        issues.push({
            id: 'sri-001',
            severity: 'WARNING',
            title: `${cdnScriptsWithoutSRI} CDN Scripts Missing SRI`,
            description: `${cdnScriptsWithoutSRI} of ${cdnScriptsTotal} third-party scripts lack Subresource Integrity (integrity="sha256-...")`,
            impact: 'If the CDN is compromised, malicious code will run on your page',
            category: 'Mixed Content & Integrity'
        });
    }

    // Score
    let score = 100;
    score -= issues.filter(i => i.severity === 'CRITICAL').length * 25;
    score -= issues.filter(i => i.severity === 'WARNING').length * 10;
    score = Math.max(0, Math.min(100, score));

    console.log(`✅ Mixed content check complete: ${mixedResources.length} mixed resources, score ${score}/100`);

    return {
        url,
        checkedAt: new Date().toISOString(),
        isHTTPS: true,
        mixedContent: mixedResources,
        sriAnalysis: {
            cdnScriptsTotal,
            cdnScriptsWithoutSRI,
            hasSRI: cdnScriptsWithoutSRI === 0 && cdnScriptsTotal > 0
        },
        issues,
        score
    };
};

module.exports = exports;
