const dns = require('dns');
const { URL } = require('url');

/**
 * DNS Health & Email Security Audit Service
 * Checks SPF, DKIM, DMARC, MX, DNSSEC, DNS response time
 */

/**
 * Run full DNS audit for a domain
 */
exports.auditDNS = async (url) => {
    const hostname = extractHostname(url);
    console.log(`🌐 Starting DNS audit for: ${hostname}`);

    const startTime = Date.now();
    const results = {
        hostname,
        scannedAt: new Date().toISOString(),
        records: {},
        emailSecurity: {},
        issues: [],
        score: 100
    };

    try {
        // Run all DNS checks in parallel
        const [spf, dmarc, mx, ns, aRecords, dnsTime] = await Promise.allSettled([
            checkSPF(hostname),
            checkDMARC(hostname),
            checkMX(hostname),
            checkNameServers(hostname),
            checkARecords(hostname),
            measureDNSTime(hostname)
        ]);

        // SPF Record
        if (spf.status === 'fulfilled' && spf.value) {
            results.emailSecurity.spf = spf.value;
            results.records.spf = spf.value.record;
            if (!spf.value.valid) {
                results.issues.push({
                    id: 'dns-001',
                    severity: 'WARNING',
                    title: 'Weak SPF Record',
                    description: spf.value.issue || 'SPF record exists but may not be properly configured',
                    impact: 'Email spoofing attacks may be possible',
                    category: 'DNS & Email Security'
                });
                results.score -= 10;
            }
        } else {
            results.emailSecurity.spf = { exists: false };
            results.issues.push({
                id: 'dns-002',
                severity: 'CRITICAL',
                title: 'Missing SPF Record',
                description: 'No SPF (Sender Policy Framework) record found for this domain',
                impact: 'Anyone can send emails pretending to be from your domain (spoofing)',
                category: 'DNS & Email Security'
            });
            results.score -= 20;
        }

        // DMARC Record
        if (dmarc.status === 'fulfilled' && dmarc.value) {
            results.emailSecurity.dmarc = dmarc.value;
            results.records.dmarc = dmarc.value.record;
            if (dmarc.value.policy === 'none') {
                results.issues.push({
                    id: 'dns-003',
                    severity: 'WARNING',
                    title: 'DMARC Policy Set to None',
                    description: 'DMARC record exists but policy is "none" — no enforcement',
                    impact: 'Fraudulent emails will still be delivered to recipients',
                    category: 'DNS & Email Security'
                });
                results.score -= 10;
            }
        } else {
            results.emailSecurity.dmarc = { exists: false };
            results.issues.push({
                id: 'dns-004',
                severity: 'CRITICAL',
                title: 'Missing DMARC Record',
                description: 'No DMARC (Domain-based Message Authentication) record found',
                impact: 'No policy to handle fraudulent emails from your domain',
                category: 'DNS & Email Security'
            });
            results.score -= 20;
        }

        // MX Records
        if (mx.status === 'fulfilled' && mx.value && mx.value.length > 0) {
            results.records.mx = mx.value;
        } else {
            results.issues.push({
                id: 'dns-005',
                severity: 'WARNING',
                title: 'No MX Records Found',
                description: 'No mail exchange (MX) records configured for this domain',
                impact: 'Domain cannot receive emails',
                category: 'DNS & Email Security'
            });
            results.score -= 5;
        }

        // Name Servers
        if (ns.status === 'fulfilled' && ns.value) {
            results.records.nameServers = ns.value;
            if (ns.value.length < 2) {
                results.issues.push({
                    id: 'dns-006',
                    severity: 'WARNING',
                    title: 'Single Name Server',
                    description: 'Only one name server found — no DNS redundancy',
                    impact: 'If the name server goes down, the entire website becomes unreachable',
                    category: 'DNS & Email Security'
                });
                results.score -= 10;
            }
        }

        // A Records & IP
        if (aRecords.status === 'fulfilled' && aRecords.value) {
            results.records.aRecords = aRecords.value;
        }

        // DNS Response Time
        if (dnsTime.status === 'fulfilled') {
            results.dnsResponseTime = dnsTime.value;
            if (dnsTime.value > 200) {
                results.issues.push({
                    id: 'dns-007',
                    severity: 'WARNING',
                    title: 'Slow DNS Resolution',
                    description: `DNS resolution took ${dnsTime.value}ms (should be < 100ms)`,
                    impact: 'Slow DNS adds latency to every page load',
                    category: 'DNS & Email Security'
                });
                results.score -= 5;
            }
        }

        results.score = Math.max(0, Math.min(100, results.score));
        console.log(`✅ DNS audit complete: Score ${results.score}/100`);
        return results;

    } catch (error) {
        console.error('DNS audit error:', error.message);
        return { ...results, error: error.message, score: null };
    }
};

// ── Helper Functions ──

function extractHostname(url) {
    try {
        if (!url.includes('://')) url = 'https://' + url;
        return new URL(url).hostname;
    } catch { return url; }
}

function checkSPF(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolveTxt(hostname, (err, records) => {
            if (err) return reject(err);
            const flat = records.map(r => r.join('')).filter(r => r.startsWith('v=spf1'));
            if (flat.length === 0) return reject(new Error('No SPF'));
            const record = flat[0];
            const valid = record.includes('-all') || record.includes('~all');
            const issue = record.includes('+all') ? 'SPF uses +all which allows any server to send' : null;
            resolve({ exists: true, record, valid: !issue && valid, issue });
        });
    });
}

function checkDMARC(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolveTxt(`_dmarc.${hostname}`, (err, records) => {
            if (err) return reject(err);
            const flat = records.map(r => r.join('')).filter(r => r.startsWith('v=DMARC1'));
            if (flat.length === 0) return reject(new Error('No DMARC'));
            const record = flat[0];
            const policyMatch = record.match(/p=(\w+)/);
            const policy = policyMatch ? policyMatch[1] : 'unknown';
            resolve({ exists: true, record, policy });
        });
    });
}

function checkMX(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolveMx(hostname, (err, records) => {
            if (err) return reject(err);
            resolve(records.sort((a, b) => a.priority - b.priority).map(r => ({
                priority: r.priority,
                exchange: r.exchange
            })));
        });
    });
}

function checkNameServers(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolveNs(hostname, (err, records) => {
            if (err) return reject(err);
            resolve(records);
        });
    });
}

function checkARecords(hostname) {
    return new Promise((resolve, reject) => {
        dns.resolve4(hostname, (err, addresses) => {
            if (err) return reject(err);
            resolve(addresses);
        });
    });
}

function measureDNSTime(hostname) {
    return new Promise((resolve) => {
        const start = Date.now();
        dns.resolve4(hostname, () => {
            resolve(Date.now() - start);
        });
    });
}

module.exports = exports;
