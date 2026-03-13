const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * HTTP Redirect Chain Analyzer
 * Tracks full redirect chain, detects loops, mixed content, unnecessary hops
 */

/**
 * Analyze the redirect chain for a URL
 */
exports.analyzeRedirects = async (url) => {
    console.log(`🔄 Analyzing redirect chain for: ${url}`);

    const chain = [];
    const issues = [];
    let currentUrl = url;
    const visited = new Set();
    const maxRedirects = 10;

    try {
        for (let i = 0; i < maxRedirects; i++) {
            if (visited.has(currentUrl)) {
                issues.push({
                    id: 'redirect-001',
                    severity: 'CRITICAL',
                    title: 'Redirect Loop Detected',
                    description: `URL "${currentUrl}" redirects back to itself`,
                    impact: 'Browser will show "Too many redirects" error — page cannot be loaded',
                    category: 'Redirect Chain'
                });
                break;
            }

            visited.add(currentUrl);
            const result = await followOneHop(currentUrl);
            chain.push(result);

            if (result.redirectUrl) {
                // Check mixed content (HTTPS → HTTP)
                if (currentUrl.startsWith('https://') && result.redirectUrl.startsWith('http://')) {
                    issues.push({
                        id: 'redirect-002',
                        severity: 'CRITICAL',
                        title: 'HTTPS to HTTP Redirect',
                        description: `Secure page redirects to insecure: ${result.redirectUrl}`,
                        impact: 'Security downgrade — data can be intercepted after redirect',
                        category: 'Redirect Chain'
                    });
                }

                currentUrl = result.redirectUrl;
            } else {
                break; // Final destination reached
            }
        }

        // Check for too many redirects
        const redirectCount = chain.filter(c => c.statusCode >= 300 && c.statusCode < 400).length;
        if (redirectCount > 3) {
            issues.push({
                id: 'redirect-003',
                severity: 'WARNING',
                title: `${redirectCount} Redirects in Chain`,
                description: `URL goes through ${redirectCount} redirects before reaching final destination`,
                impact: 'Each redirect adds ~100-300ms latency. Users wait longer.',
                category: 'Redirect Chain'
            });
        }

        // Check HTTP → HTTPS redirect exists
        if (url.startsWith('http://')) {
            const firstHop = chain[0];
            if (!firstHop?.redirectUrl?.startsWith('https://')) {
                issues.push({
                    id: 'redirect-004',
                    severity: 'CRITICAL',
                    title: 'No HTTP to HTTPS Redirect',
                    description: 'HTTP version does not redirect to HTTPS',
                    impact: 'Users on HTTP get no encryption — passwords and data exposed',
                    category: 'Redirect Chain'
                });
            }
        }

        let score = 100;
        score -= issues.filter(i => i.severity === 'CRITICAL').length * 25;
        score -= issues.filter(i => i.severity === 'WARNING').length * 10;
        score = Math.max(0, Math.min(100, score));

        console.log(`✅ Redirect analysis complete: ${chain.length} hops`);

        return {
            url,
            analyzedAt: new Date().toISOString(),
            chain,
            totalRedirects: redirectCount,
            finalUrl: chain[chain.length - 1]?.url || url,
            issues,
            score
        };

    } catch (error) {
        console.error('Redirect analysis error:', error.message);
        return { url, chain, issues, score: null, error: error.message };
    }
};

function followOneHop(url) {
    return new Promise((resolve) => {
        const proto = url.startsWith('https') ? https : http;
        const options = {
            method: 'HEAD',
            timeout: 5000,
            headers: { 'User-Agent': 'HealthChecker-Bot/1.0' }
        };

        try {
            const req = proto.request(url, options, (res) => {
                const statusCode = res.statusCode;
                let redirectUrl = null;

                if (statusCode >= 300 && statusCode < 400 && res.headers.location) {
                    redirectUrl = new URL(res.headers.location, url).href;
                }

                resolve({
                    url,
                    statusCode,
                    redirectUrl,
                    server: res.headers['server'] || null
                });

                res.resume(); // Consume response
            });

            req.on('error', () => resolve({ url, statusCode: 0, redirectUrl: null, error: 'Connection failed' }));
            req.on('timeout', () => { req.destroy(); resolve({ url, statusCode: 0, redirectUrl: null, error: 'Timeout' }); });
            req.end();
        } catch {
            resolve({ url, statusCode: 0, redirectUrl: null, error: 'Invalid URL' });
        }
    });
}

module.exports = exports;
