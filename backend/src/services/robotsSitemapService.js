/**
 * Robots.txt & Sitemap.xml Analyzer
 * Checks if robots.txt exists, validates directives, checks sitemap presence
 */
const axios = require('axios');

async function analyzeRobotsSitemap(targetUrl) {
    const issues = [];
    let score = 100;
    const baseUrl = new URL(targetUrl).origin;

    // ── 1. Check robots.txt ──
    try {
        const robotsUrl = `${baseUrl}/robots.txt`;
        const res = await axios.get(robotsUrl, { timeout: 8000, validateStatus: () => true });

        if (res.status === 200 && typeof res.data === 'string' && res.data.length > 0) {
            const content = res.data;

            // Check for Disallow: /
            if (/Disallow:\s*\/\s*$/m.test(content)) {
                issues.push({
                    id: 'robots-blocks-all',
                    severity: 'CRITICAL',
                    title: 'Robots.txt Blocks All Crawlers',
                    description: 'Your robots.txt contains "Disallow: /" which blocks all search engines from crawling your site.',
                    impact: 'Site will NOT appear in Google search results',
                    category: 'Robots.txt'
                });
                score -= 40;
            }

            // Check for sitemap reference
            if (!/sitemap:/i.test(content)) {
                issues.push({
                    id: 'robots-no-sitemap-ref',
                    severity: 'WARNING',
                    title: 'No Sitemap Reference in Robots.txt',
                    description: 'robots.txt does not reference a sitemap URL. Adding a Sitemap directive helps search engines find your sitemap.',
                    impact: 'Search engines may not discover all pages efficiently',
                    category: 'Robots.txt'
                });
                score -= 10;
            }

            // Check for crawl-delay
            if (/crawl-delay/i.test(content)) {
                issues.push({
                    id: 'robots-crawl-delay',
                    severity: 'WARNING',
                    title: 'Crawl-Delay Directive Found',
                    description: 'robots.txt contains a Crawl-delay directive. Google ignores this, but other crawlers will slow down.',
                    impact: 'May slow indexing by Bing and other search engines',
                    category: 'Robots.txt'
                });
                score -= 5;
            }
        } else {
            issues.push({
                id: 'robots-missing',
                severity: 'WARNING',
                title: 'No Robots.txt Found',
                description: `No robots.txt file found at ${robotsUrl}. This file helps search engines understand how to crawl your site.`,
                impact: 'Search engines crawl without guidelines — may index unwanted pages',
                category: 'Robots.txt'
            });
            score -= 15;
        }
    } catch (e) {
        issues.push({
            id: 'robots-error',
            severity: 'WARNING',
            title: 'Cannot Access Robots.txt',
            description: 'Failed to fetch robots.txt: ' + e.message,
            impact: 'Unable to verify crawl directives',
            category: 'Robots.txt'
        });
        score -= 10;
    }

    // ── 2. Check Sitemap.xml ──
    const sitemapUrls = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`];
    let sitemapFound = false;

    for (const sitemapUrl of sitemapUrls) {
        try {
            const res = await axios.get(sitemapUrl, { timeout: 8000, validateStatus: () => true });
            if (res.status === 200 && typeof res.data === 'string' && res.data.includes('<url')) {
                sitemapFound = true;

                // Count URLs in sitemap
                const urlCount = (res.data.match(/<url>/gi) || []).length;
                if (urlCount === 0) {
                    issues.push({
                        id: 'sitemap-empty',
                        severity: 'WARNING',
                        title: 'Sitemap is Empty',
                        description: 'Sitemap.xml exists but contains no URL entries.',
                        impact: 'Search engines cannot discover pages from sitemap',
                        category: 'Sitemap'
                    });
                    score -= 15;
                }

                // Check for lastmod
                if (!res.data.includes('<lastmod>')) {
                    issues.push({
                        id: 'sitemap-no-lastmod',
                        severity: 'WARNING',
                        title: 'Sitemap Missing Last Modified Dates',
                        description: 'Sitemap URLs do not include <lastmod> timestamps.',
                        impact: 'Search engines cannot prioritize recently updated pages',
                        category: 'Sitemap'
                    });
                    score -= 5;
                }
                break;
            }
        } catch (e) { /* skip */ }
    }

    if (!sitemapFound) {
        issues.push({
            id: 'sitemap-missing',
            severity: 'WARNING',
            title: 'No Sitemap.xml Found',
            description: 'No XML sitemap found. Sitemaps help search engines discover and index all your pages.',
            impact: 'Search engines may miss important pages',
            category: 'Sitemap'
        });
        score -= 15;
    }

    return { score: Math.max(0, score), issues, summary: { totalIssues: issues.length } };
}

module.exports = { analyzeRobotsSitemap };
