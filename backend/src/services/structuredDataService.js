/**
 * Structured Data (Schema.org) Analyzer
 * Checks JSON-LD, Microdata, and schema markup
 */
const cheerio = require('cheerio');

function analyzeStructuredData(targetUrl, pageData) {
    const issues = [];
    let score = 100;
    const html = pageData?.html || '';
    const $ = cheerio.load(html);

    // ── 1. JSON-LD Structured Data ──
    const jsonLdScripts = $('script[type="application/ld+json"]');
    let schemas = [];

    if (jsonLdScripts.length > 0) {
        jsonLdScripts.each((i, el) => {
            try {
                const content = $(el).html();
                const parsed = JSON.parse(content);
                const types = Array.isArray(parsed) ? parsed.map(p => p['@type']) : [parsed['@type']];
                schemas.push(...types.filter(Boolean));
            } catch (e) {
                issues.push({
                    id: `schema-json-invalid-${i}`,
                    severity: 'CRITICAL',
                    title: 'Invalid JSON-LD Syntax',
                    description: `JSON-LD script #${i + 1} contains invalid JSON. Search engines cannot parse it.`,
                    impact: 'Rich snippets will not appear in Google search results',
                    category: 'JSON-LD'
                });
                score -= 15;
            }
        });
    }

    // ── 2. Microdata ──
    const microdata = $('[itemscope]');
    microdata.each((i, el) => {
        const type = $(el).attr('itemtype');
        if (type) {
            const typeName = type.split('/').pop();
            schemas.push(typeName);
        }
    });

    // ── 3. Check if ANY structured data exists ──
    if (schemas.length === 0 && jsonLdScripts.length === 0 && microdata.length === 0) {
        issues.push({
            id: 'schema-none',
            severity: 'WARNING',
            title: 'No Structured Data Found',
            description: 'No JSON-LD or Microdata schema markup detected. Structured data helps Google show rich results (star ratings, FAQs, etc.).',
            impact: 'Missing rich snippets in search — lower click-through rate',
            category: 'Schema.org'
        });
        score -= 20;
    }

    // ── 4. Check for important schema types ──
    const hasOrganization = schemas.some(s => /organization|localbusiness|company/i.test(s));
    const hasWebsite = schemas.some(s => /website|webpage/i.test(s));
    const hasBreadcrumb = schemas.some(s => /breadcrumb/i.test(s));

    if (!hasOrganization && !hasWebsite) {
        issues.push({
            id: 'schema-no-org',
            severity: 'WARNING',
            title: 'No Organization/Website Schema',
            description: 'No Organization or WebSite schema found. This helps Google understand your brand and show knowledge panels.',
            impact: 'Google may not display your brand info in search results',
            category: 'Schema.org'
        });
        score -= 10;
    }

    if (!hasBreadcrumb) {
        issues.push({
            id: 'schema-no-breadcrumb',
            severity: 'WARNING',
            title: 'No BreadcrumbList Schema',
            description: 'No breadcrumb structured data found. Breadcrumbs improve how your pages appear in Google search.',
            impact: 'Search results show plain URLs instead of breadcrumb navigation',
            category: 'Schema.org'
        });
        score -= 5;
    }

    // ── 5. Check for common useful schemas ──
    const recommendedSchemas = ['Article', 'Product', 'FAQ', 'HowTo', 'Review', 'Event', 'Recipe'];
    const pageContent = html.toLowerCase();
    
    // Suggest FAQ schema if page has question-like content
    if ((pageContent.includes('faq') || pageContent.includes('frequently asked')) &&
        !schemas.some(s => /faq/i.test(s))) {
        issues.push({
            id: 'schema-faq-missing',
            severity: 'WARNING',
            title: 'FAQ Content Without FAQPage Schema',
            description: 'Page appears to have FAQ content but no FAQPage schema markup. Adding this can enable FAQ rich results in Google.',
            impact: 'Missing opportunity for expanded search listings',
            category: 'Rich Results'
        });
        score -= 5;
    }

    return {
        score: Math.max(0, score),
        issues,
        summary: {
            totalIssues: issues.length,
            schemasFound: schemas,
            jsonLdCount: jsonLdScripts.length,
            microdataCount: microdata.length
        }
    };
}

module.exports = { analyzeStructuredData };
