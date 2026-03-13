/**
 * Uptime & Response Time Analyzer
 * Measures TTFB, total response time, status codes, server health
 */
const axios = require('axios');
const https = require('https');
const http = require('http');

async function analyzeUptime(targetUrl) {
    const issues = [];
    let score = 100;

    // ── 1. Response Time & TTFB ──
    try {
        const startTime = Date.now();
        let ttfb = 0;

        const res = await axios.get(targetUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'HealthChecker-UptimeBot/1.0' },
            maxRedirects: 5,
            validateStatus: () => true,
            onDownloadProgress: () => {
                if (ttfb === 0) ttfb = Date.now() - startTime;
            }
        });

        const totalTime = Date.now() - startTime;
        if (ttfb === 0) ttfb = totalTime;
        const statusCode = res.status;

        // Status code check
        if (statusCode >= 500) {
            issues.push({
                id: 'uptime-server-error',
                severity: 'CRITICAL',
                title: `Server Error (HTTP ${statusCode})`,
                description: `Server returned ${statusCode} status code indicating a server-side error.`,
                impact: 'Website is broken — users see error page',
                category: 'Status'
            });
            score -= 40;
        } else if (statusCode >= 400) {
            issues.push({
                id: 'uptime-client-error',
                severity: 'WARNING',
                title: `Client Error (HTTP ${statusCode})`,
                description: `Server returned ${statusCode} status code.`,
                impact: 'Page may not be accessible to users',
                category: 'Status'
            });
            score -= 20;
        }

        // TTFB check
        if (ttfb > 2000) {
            issues.push({
                id: 'uptime-slow-ttfb',
                severity: 'CRITICAL',
                title: `Very Slow TTFB (${ttfb}ms)`,
                description: `Time to First Byte is ${ttfb}ms. Good TTFB is under 600ms.`,
                impact: 'Users wait too long before anything loads — high bounce rate',
                category: 'Response Time'
            });
            score -= 25;
        } else if (ttfb > 800) {
            issues.push({
                id: 'uptime-moderate-ttfb',
                severity: 'WARNING',
                title: `Slow TTFB (${ttfb}ms)`,
                description: `Time to First Byte is ${ttfb}ms. Aim for under 600ms.`,
                impact: 'Page feels slow to start loading',
                category: 'Response Time'
            });
            score -= 10;
        }

        // Total response time
        if (totalTime > 5000) {
            issues.push({
                id: 'uptime-very-slow',
                severity: 'CRITICAL',
                title: `Very Slow Response (${totalTime}ms)`,
                description: `Total page download took ${totalTime}ms. Should be under 3 seconds.`,
                impact: '53% of mobile users leave if page takes >3 seconds',
                category: 'Response Time'
            });
            score -= 20;
        } else if (totalTime > 3000) {
            issues.push({
                id: 'uptime-slow',
                severity: 'WARNING',
                title: `Slow Response (${totalTime}ms)`,
                description: `Total response time is ${totalTime}ms.`,
                impact: 'Users may perceive site as slow',
                category: 'Response Time'
            });
            score -= 10;
        }

        // Check for compression
        const encoding = res.headers['content-encoding'];
        if (!encoding || !['gzip', 'br', 'deflate'].includes(encoding)) {
            issues.push({
                id: 'uptime-no-compression',
                severity: 'WARNING',
                title: 'No Response Compression',
                description: 'Server is not using gzip/brotli compression. This increases data transfer size.',
                impact: 'Pages download slower — especially on mobile networks',
                category: 'Optimization'
            });
            score -= 10;
        }

        // Check for keep-alive
        const connection = res.headers['connection'];
        if (connection && connection.toLowerCase() === 'close') {
            issues.push({
                id: 'uptime-no-keepalive',
                severity: 'WARNING',
                title: 'No Keep-Alive Connection',
                description: 'Server closes connection after each request instead of keeping it alive.',
                impact: 'Each subsequent request requires new TCP handshake — slower loading',
                category: 'Optimization'
            });
            score -= 5;
        }

    } catch (e) {
        if (e.code === 'ECONNREFUSED') {
            issues.push({
                id: 'uptime-down',
                severity: 'CRITICAL',
                title: 'Website is DOWN',
                description: 'Connection refused — the server is not responding.',
                impact: 'Website is completely inaccessible to all users',
                category: 'Status'
            });
            score = 0;
        } else if (e.code === 'ETIMEDOUT' || e.code === 'ECONNABORTED') {
            issues.push({
                id: 'uptime-timeout',
                severity: 'CRITICAL',
                title: 'Connection Timed Out',
                description: 'Server did not respond within 15 seconds.',
                impact: 'Website is effectively unreachable — users will leave',
                category: 'Status'
            });
            score = 10;
        } else {
            issues.push({
                id: 'uptime-error',
                severity: 'WARNING',
                title: 'Uptime Check Failed',
                description: 'Could not complete uptime check: ' + e.message,
                impact: 'Unable to verify server availability',
                category: 'Status'
            });
            score -= 20;
        }
    }

    return { score: Math.max(0, score), issues, summary: { totalIssues: issues.length } };
}

module.exports = { analyzeUptime };
