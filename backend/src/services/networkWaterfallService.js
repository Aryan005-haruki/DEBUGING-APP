/**
 * Network Waterfall Service
 * Analyzes all resources loaded by a page — timing, size, type
 * Uses page data already collected by crawler (no extra Puppeteer needed)
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Analyze network resources from crawled page data
 */
exports.analyzeNetwork = (url, pageData) => {
    console.log(`📊 Analyzing network waterfall for: ${url}`);

    const html = pageData.html || '';
    const scripts = pageData.resources?.js || [];
    const stylesheets = pageData.resources?.css || [];
    const images = pageData.resources?.images || [];
    const issues = [];

    // Categorize resources
    const resources = [];

    // JS files
    scripts.forEach(src => {
        resources.push({
            type: 'JavaScript',
            url: src,
            isThirdParty: isThirdParty(url, src)
        });
    });

    // CSS files
    stylesheets.forEach(href => {
        resources.push({
            type: 'Stylesheet',
            url: href,
            isThirdParty: isThirdParty(url, href)
        });
    });

    // Images
    images.forEach(img => {
        resources.push({
            type: 'Image',
            url: img.url || img,
            isThirdParty: isThirdParty(url, img.url || img),
            alt: img.alt
        });
    });

    // Count inline scripts
    const inlineScriptCount = (html.match(/<script(?![^>]*src)[^>]*>/gi) || []).length;
    const inlineStyleCount = (html.match(/<style[^>]*>/gi) || []).length;

    // Analyze resource breakdown
    const thirdPartyCount = resources.filter(r => r.isThirdParty).length;
    const firstPartyCount = resources.length - thirdPartyCount;

    // ── Issues ──
    if (scripts.length > 15) {
        issues.push({
            id: 'net-001',
            severity: 'WARNING',
            title: 'Too Many JavaScript Files',
            description: `Page loads ${scripts.length} JavaScript files (recommended: < 10)`,
            impact: 'Each file requires a separate HTTP request, slowing page load',
            category: 'Network Performance'
        });
    }

    if (stylesheets.length > 8) {
        issues.push({
            id: 'net-002',
            severity: 'WARNING',
            title: 'Too Many CSS Files',
            description: `Page loads ${stylesheets.length} stylesheets (recommended: < 5)`,
            impact: 'CSS files block rendering until fully downloaded',
            category: 'Network Performance'
        });
    }

    if (images.length > 30) {
        issues.push({
            id: 'net-003',
            severity: 'WARNING',
            title: 'Excessive Images',
            description: `Page contains ${images.length} images. Consider lazy loading.`,
            impact: 'Large number of images significantly increase page weight',
            category: 'Network Performance'
        });
    }

    if (thirdPartyCount > 10) {
        issues.push({
            id: 'net-004',
            severity: 'WARNING',
            title: 'Heavy Third-Party Usage',
            description: `${thirdPartyCount} third-party resources loaded (tracking, ads, fonts, etc.)`,
            impact: 'Third-party scripts can slow down your page and compromise privacy',
            category: 'Network Performance'
        });
    }

    if (inlineScriptCount > 5) {
        issues.push({
            id: 'net-005',
            severity: 'WARNING',
            title: 'Many Inline Scripts',
            description: `Found ${inlineScriptCount} inline <script> blocks`,
            impact: 'Inline scripts block HTML parsing and cannot be cached',
            category: 'Network Performance'
        });
    }

    // Check for render-blocking resources
    const renderBlocking = scripts.filter(s => !s.includes('async') && !s.includes('defer'));

    // Estimate page weight from HTML + resource count
    const estimatedWeight = {
        html: Buffer.byteLength(html, 'utf8'),
        jsCount: scripts.length,
        cssCount: stylesheets.length,
        imageCount: images.length,
        totalResources: resources.length
    };

    // Score
    let score = 100;
    score -= issues.filter(i => i.severity === 'CRITICAL').length * 20;
    score -= issues.filter(i => i.severity === 'WARNING').length * 8;
    score = Math.max(0, Math.min(100, score));

    console.log(`✅ Network analysis complete: ${resources.length} resources, score ${score}/100`);

    return {
        url,
        analyzedAt: new Date().toISOString(),
        resourceBreakdown: {
            javascript: scripts.length,
            stylesheets: stylesheets.length,
            images: images.length,
            inlineScripts: inlineScriptCount,
            inlineStyles: inlineStyleCount,
            total: resources.length
        },
        thirdPartyAnalysis: {
            thirdParty: thirdPartyCount,
            firstParty: firstPartyCount,
            ratio: resources.length > 0 ? Math.round((thirdPartyCount / resources.length) * 100) : 0
        },
        pageWeight: estimatedWeight,
        issues,
        score
    };
};

function isThirdParty(pageUrl, resourceUrl) {
    try {
        const pageDomain = new URL(pageUrl).hostname.replace('www.', '');
        const resDomain = new URL(resourceUrl).hostname.replace('www.', '');
        return pageDomain !== resDomain;
    } catch {
        return false;
    }
}

module.exports = exports;
