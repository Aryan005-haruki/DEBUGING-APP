/**
 * Technology Stack Detection Service
 * Detects server, frameworks, CMS, analytics, CDN from headers + HTML
 */

/**
 * Detect technologies used by a website
 * @param {string} url - Website URL
 * @param {Object} pageData - { html, headers, resources }
 */
exports.detectTechnologies = (url, pageData) => {
    console.log(`🔍 Detecting technologies for: ${url}`);

    const html = pageData.html || '';
    const headers = normalizeHeaders(pageData.headers || {});
    const scripts = pageData.resources?.js || [];
    const css = pageData.resources?.css || [];
    const issues = [];
    const detected = [];

    // ── 1. Server Detection ──
    const server = headers['server'] || headers['x-powered-by'] || '';
    if (server) {
        detected.push({ category: 'Server', name: server, confidence: 'high' });

        // Check for version exposure
        if (/\d+\.\d+/.test(server)) {
            issues.push({
                id: 'tech-001',
                severity: 'WARNING',
                title: 'Server Version Exposed',
                description: `Server header reveals version: "${server}"`,
                impact: 'Attackers can look up known vulnerabilities for this exact version',
                category: 'Technology Stack'
            });
        }
    }

    // X-Powered-By
    if (headers['x-powered-by']) {
        detected.push({ category: 'Runtime', name: headers['x-powered-by'], confidence: 'high' });
        issues.push({
            id: 'tech-002',
            severity: 'WARNING',
            title: 'X-Powered-By Header Exposed',
            description: `X-Powered-By header reveals: "${headers['x-powered-by']}"`,
            impact: 'Reveals server technology, making targeted attacks easier',
            category: 'Technology Stack'
        });
    }

    // ── 2. Frontend Framework Detection ──
    const frameworkPatterns = [
        { name: 'React', patterns: ['react.production.min.js', 'react-dom', '__NEXT_DATA__', '_next/', 'data-reactroot', 'data-reactid'] },
        { name: 'Next.js', patterns: ['__NEXT_DATA__', '_next/static', 'next/dist'] },
        { name: 'Vue.js', patterns: ['vue.min.js', 'vue.js', '__vue__', 'data-v-', 'Vue.component'] },
        { name: 'Nuxt.js', patterns: ['__NUXT__', '_nuxt/', 'nuxt.config'] },
        { name: 'Angular', patterns: ['ng-version', 'ng-app', 'angular.min.js', 'zone.js', 'ng-controller'] },
        { name: 'Svelte', patterns: ['svelte', '__svelte'] },
        { name: 'jQuery', patterns: ['jquery.min.js', 'jquery.js', 'jQuery(', '$(document)'] },
        { name: 'Bootstrap', patterns: ['bootstrap.min.css', 'bootstrap.min.js', 'bootstrap.css'] },
        { name: 'Tailwind CSS', patterns: ['tailwindcss', 'tailwind.min.css'] },
        { name: 'Material UI', patterns: ['@mui', 'material-ui', 'MuiButton'] },
    ];

    const allSources = html + ' ' + scripts.join(' ') + ' ' + css.join(' ');

    frameworkPatterns.forEach(fw => {
        const matched = fw.patterns.filter(p => allSources.includes(p));
        if (matched.length > 0) {
            detected.push({
                category: 'Frontend',
                name: fw.name,
                confidence: matched.length >= 2 ? 'high' : 'medium',
                evidence: matched.slice(0, 2)
            });
        }
    });

    // ── 3. CMS Detection ──
    const cmsPatterns = [
        { name: 'WordPress', patterns: ['wp-content/', 'wp-includes/', 'wp-json', 'wordpress'] },
        { name: 'Shopify', patterns: ['cdn.shopify.com', 'shopify.com', 'Shopify.theme'] },
        { name: 'Wix', patterns: ['wix.com', 'wixstatic.com', '_wix_'] },
        { name: 'Squarespace', patterns: ['squarespace.com', 'sqsp.net', 'squarespace-cdn'] },
        { name: 'Drupal', patterns: ['Drupal.settings', 'drupal.js', '/sites/default/'] },
        { name: 'Joomla', patterns: ['/media/jui/', 'Joomla!', '/administrator/'] },
        { name: 'Webflow', patterns: ['webflow.com', 'wf-page', 'webflow.js'] },
        { name: 'Ghost', patterns: ['ghost.org', 'ghost-url', 'ghost/api'] },
    ];

    cmsPatterns.forEach(cms => {
        const matched = cms.patterns.filter(p => allSources.toLowerCase().includes(p.toLowerCase()));
        if (matched.length > 0) {
            detected.push({
                category: 'CMS',
                name: cms.name,
                confidence: matched.length >= 2 ? 'high' : 'medium'
            });
        }
    });

    // ── 4. Analytics & Tracking ──
    const analyticsPatterns = [
        { name: 'Google Analytics (GA4)', patterns: ['gtag(', 'G-', 'googletagmanager.com/gtag'] },
        { name: 'Google Analytics (UA)', patterns: ['UA-', 'analytics.js', 'ga(\'create'] },
        { name: 'Google Tag Manager', patterns: ['googletagmanager.com/gtm.js', 'GTM-'] },
        { name: 'Facebook Pixel', patterns: ['fbq(', 'connect.facebook.net/en_US/fbevents'] },
        { name: 'Hotjar', patterns: ['hotjar.com', 'hj(', '_hjSettings'] },
        { name: 'Microsoft Clarity', patterns: ['clarity.ms/tag', 'clarity('] },
    ];

    analyticsPatterns.forEach(analytics => {
        if (analytics.patterns.some(p => allSources.includes(p))) {
            detected.push({ category: 'Analytics', name: analytics.name, confidence: 'high' });
        }
    });

    // ── 5. CDN Detection ──
    const cdnPatterns = [
        { name: 'Cloudflare', headers: ['cf-ray', 'cf-cache-status'], patterns: ['cdnjs.cloudflare.com'] },
        { name: 'AWS CloudFront', headers: ['x-amz-cf-id'], patterns: ['cloudfront.net'] },
        { name: 'Fastly', headers: ['x-fastly-request-id'], patterns: ['fastly.net'] },
        { name: 'Akamai', headers: ['x-akamai-transformed'], patterns: ['akamai.net'] },
        { name: 'Vercel', headers: ['x-vercel-id'], patterns: ['vercel.app'] },
    ];

    cdnPatterns.forEach(cdn => {
        const headerMatch = cdn.headers?.some(h => headers[h]);
        const patternMatch = cdn.patterns?.some(p => allSources.includes(p));
        if (headerMatch || patternMatch) {
            detected.push({ category: 'CDN / Hosting', name: cdn.name, confidence: 'high' });
        }
    });

    // ── 6. Meta Generator ──
    const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']+)["']/i);
    if (generatorMatch) {
        detected.push({ category: 'Generator', name: generatorMatch[1], confidence: 'high' });
    }

    // ── Deprecated / outdated library warnings ──
    const jqueryVersionMatch = allSources.match(/jquery[.-](\d+\.\d+\.\d+)/i);
    if (jqueryVersionMatch) {
        const ver = jqueryVersionMatch[1];
        const major = parseInt(ver.split('.')[0]);
        if (major < 3) {
            issues.push({
                id: 'tech-003',
                severity: 'WARNING',
                title: `Outdated jQuery Version (${ver})`,
                description: `jQuery ${ver} is outdated and may have security vulnerabilities`,
                impact: 'Known XSS vulnerabilities in older jQuery versions',
                category: 'Technology Stack'
            });
        }
    }

    // Score calculation
    let score = 100;
    const critCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const warnCount = issues.filter(i => i.severity === 'WARNING').length;
    score -= (critCount * 20) + (warnCount * 10);
    score = Math.max(0, Math.min(100, score));

    console.log(`✅ Technology detection complete: ${detected.length} technologies found`);

    return {
        url,
        detectedAt: new Date().toISOString(),
        technologies: detected,
        issues,
        score,
        summary: {
            totalDetected: detected.length,
            categories: [...new Set(detected.map(d => d.category))]
        }
    };
};

function normalizeHeaders(headers) {
    const norm = {};
    for (const [k, v] of Object.entries(headers)) {
        norm[k.toLowerCase()] = v;
    }
    return norm;
}

module.exports = exports;
