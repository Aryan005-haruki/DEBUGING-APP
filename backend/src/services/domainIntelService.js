const dns = require('dns');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Domain Intelligence Service
 * Domain age, registrar, WHOIS info, expiry via RDAP (free, no npm needed)
 */

/**
 * Get domain intelligence
 */
exports.getDomainIntel = async (url) => {
    const hostname = extractHostname(url);
    const domain = extractRootDomain(hostname);
    console.log(`🏢 Getting domain intelligence for: ${domain}`);

    const results = {
        domain,
        scannedAt: new Date().toISOString(),
        whois: {},
        issues: [],
        score: 100
    };

    try {
        // Try RDAP first (free public JSON API for WHOIS data)
        const rdapData = await queryRDAP(domain);

        if (rdapData) {
            // Extract registration date
            const regEvent = rdapData.events?.find(e => e.eventAction === 'registration');
            const expEvent = rdapData.events?.find(e => e.eventAction === 'expiration');
            const lastChanged = rdapData.events?.find(e => e.eventAction === 'last changed');

            if (regEvent) {
                const regDate = new Date(regEvent.eventDate);
                const ageYears = ((Date.now() - regDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
                results.whois.registrationDate = regDate.toISOString();
                results.whois.domainAge = `${ageYears} years`;

                if (parseFloat(ageYears) < 1) {
                    results.issues.push({
                        id: 'domain-001',
                        severity: 'WARNING',
                        title: 'Very New Domain',
                        description: `Domain is only ${ageYears} years old`,
                        impact: 'New domains have lower trust in search engines and may be flagged by security tools',
                        category: 'Domain Intelligence'
                    });
                    results.score -= 10;
                }
            }

            if (expEvent) {
                const expDate = new Date(expEvent.eventDate);
                const daysUntilExpiry = Math.floor((expDate - Date.now()) / (1000 * 60 * 60 * 24));
                results.whois.expiryDate = expDate.toISOString();
                results.whois.daysUntilExpiry = daysUntilExpiry;

                if (daysUntilExpiry < 30) {
                    results.issues.push({
                        id: 'domain-002',
                        severity: 'CRITICAL',
                        title: 'Domain Expiring Soon!',
                        description: `Domain expires in ${daysUntilExpiry} days (${expDate.toLocaleDateString()})`,
                        impact: 'If not renewed, the website will go offline and someone else can register it',
                        category: 'Domain Intelligence'
                    });
                    results.score -= 25;
                } else if (daysUntilExpiry < 90) {
                    results.issues.push({
                        id: 'domain-003',
                        severity: 'WARNING',
                        title: 'Domain Expiry Warning',
                        description: `Domain expires in ${daysUntilExpiry} days`,
                        impact: 'Consider renewing the domain to avoid service interruption',
                        category: 'Domain Intelligence'
                    });
                    results.score -= 5;
                }
            }

            if (lastChanged) {
                results.whois.lastUpdated = new Date(lastChanged.eventDate).toISOString();
            }

            // Registrar info
            const registrar = rdapData.entities?.find(e => e.roles?.includes('registrar'));
            if (registrar) {
                results.whois.registrar = registrar.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3]
                    || registrar.handle || 'Unknown';
            }

            // Name servers from RDAP
            if (rdapData.nameservers) {
                results.whois.nameServers = rdapData.nameservers.map(ns => ns.ldhName);
            }

            // Status
            if (rdapData.status) {
                results.whois.status = rdapData.status;
                if (rdapData.status.includes('clientHold') || rdapData.status.includes('serverHold')) {
                    results.issues.push({
                        id: 'domain-004',
                        severity: 'CRITICAL',
                        title: 'Domain On Hold',
                        description: 'Domain has a hold status, which may prevent it from resolving',
                        impact: 'Website may become unreachable at any time',
                        category: 'Domain Intelligence'
                    });
                    results.score -= 20;
                }
            }
        }

        results.score = Math.max(0, Math.min(100, results.score));
        console.log(`✅ Domain intel complete: Score ${results.score}/100`);
        return results;

    } catch (error) {
        console.error('Domain intel error:', error.message);
        return { ...results, error: error.message, score: null };
    }
};

// ── RDAP Query (Free Public WHOIS alternative, returns JSON) ──

function queryRDAP(domain) {
    return new Promise((resolve) => {
        // Use RDAP bootstrap to find correct RDAP server
        const rdapUrl = `https://rdap.org/domain/${domain}`;

        const req = https.get(rdapUrl, { timeout: 8000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch { resolve(null); }
            });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
}

function extractHostname(url) {
    try {
        if (!url.includes('://')) url = 'https://' + url;
        return new URL(url).hostname;
    } catch { return url; }
}

function extractRootDomain(hostname) {
    const parts = hostname.split('.');
    if (parts.length > 2) {
        // Handle co.uk, com.au, etc.
        const twoPartTLDs = ['co.uk', 'com.au', 'co.in', 'co.jp', 'org.uk', 'net.au'];
        const lastTwo = parts.slice(-2).join('.');
        if (twoPartTLDs.includes(lastTwo)) {
            return parts.slice(-3).join('.');
        }
        return parts.slice(-2).join('.');
    }
    return hostname;
}

module.exports = exports;
