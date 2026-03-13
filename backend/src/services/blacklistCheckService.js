const dns = require('dns');
const { URL } = require('url');

/**
 * Blacklist & Reputation Check Service
 * Checks DNSBL blacklists, IP geolocation, reverse DNS
 */

/**
 * Check domain/IP blacklist status and reputation
 */
exports.checkBlacklist = async (url) => {
    const hostname = extractHostname(url);
    console.log(`🛡️ Checking blacklist for: ${hostname}`);

    const results = {
        hostname,
        checkedAt: new Date().toISOString(),
        ip: null,
        reverseDns: null,
        blacklistResults: [],
        issues: [],
        score: 100
    };

    try {
        // Step 1: Resolve domain to IP
        const ip = await resolveIP(hostname);
        if (!ip) {
            results.issues.push({
                id: 'bl-000',
                severity: 'WARNING',
                title: 'Could Not Resolve IP',
                description: `DNS resolution failed for ${hostname}`,
                impact: 'Cannot check blacklists without IP address',
                category: 'Blacklist & Reputation'
            });
            results.score = null;
            return results;
        }
        results.ip = ip;

        // Step 2: Reverse DNS lookup
        try {
            const rdns = await reverseDNS(ip);
            results.reverseDns = rdns;

            // Check if reverse DNS matches forward DNS
            if (rdns && !rdns.some(name => name.includes(hostname.replace('www.', '')))) {
                results.issues.push({
                    id: 'bl-rdns-001',
                    severity: 'WARNING',
                    title: 'Reverse DNS Mismatch',
                    description: `IP ${ip} reverse DNS (${rdns[0]}) does not match domain (${hostname})`,
                    impact: 'Email deliverability issues — mail servers check reverse DNS for spam detection',
                    category: 'Blacklist & Reputation'
                });
                results.score -= 5;
            }
        } catch {
            results.reverseDns = null;
        }

        // Step 3: DNSBL Blacklist checks
        const dnsblServers = [
            { name: 'Spamhaus ZEN', host: 'zen.spamhaus.org' },
            { name: 'Barracuda', host: 'b.barracudacentral.org' },
            { name: 'SpamCop', host: 'bl.spamcop.net' },
            { name: 'SORBS', host: 'dnsbl.sorbs.net' },
            { name: 'UCEPROTECT', host: 'dnsbl-1.uceprotect.net' },
        ];

        const reversed = ip.split('.').reverse().join('.');

        const checks = await Promise.allSettled(
            dnsblServers.map(server => checkDNSBL(reversed, server))
        );

        let blacklistedCount = 0;
        checks.forEach((result, idx) => {
            const serverName = dnsblServers[idx].name;
            if (result.status === 'fulfilled' && result.value.listed) {
                blacklistedCount++;
                results.blacklistResults.push({
                    server: serverName,
                    listed: true,
                    response: result.value.response
                });
            } else {
                results.blacklistResults.push({
                    server: serverName,
                    listed: false
                });
            }
        });

        if (blacklistedCount > 0) {
            const severity = blacklistedCount >= 3 ? 'CRITICAL' : 'WARNING';
            results.issues.push({
                id: 'bl-001',
                severity,
                title: `IP Blacklisted on ${blacklistedCount} Lists`,
                description: `Server IP ${ip} is listed on ${blacklistedCount} DNS blacklists: ${results.blacklistResults.filter(r => r.listed).map(r => r.server).join(', ')}`,
                impact: 'Emails from this server may be rejected. Domain reputation is damaged.',
                category: 'Blacklist & Reputation'
            });
            results.score -= blacklistedCount * 15;
        }

        results.score = Math.max(0, Math.min(100, results.score));
        console.log(`✅ Blacklist check complete: ${blacklistedCount} blacklists, score ${results.score}/100`);
        return results;

    } catch (error) {
        console.error('Blacklist check error:', error.message);
        return { ...results, error: error.message, score: null };
    }
};

// ── Helper functions ──

function extractHostname(url) {
    try {
        if (!url.includes('://')) url = 'https://' + url;
        return new URL(url).hostname;
    } catch { return url; }
}

function resolveIP(hostname) {
    return new Promise((resolve) => {
        dns.resolve4(hostname, (err, addresses) => {
            if (err || !addresses || addresses.length === 0) return resolve(null);
            resolve(addresses[0]);
        });
    });
}

function reverseDNS(ip) {
    return new Promise((resolve, reject) => {
        dns.reverse(ip, (err, hostnames) => {
            if (err) return reject(err);
            resolve(hostnames);
        });
    });
}

function checkDNSBL(reversedIP, server) {
    return new Promise((resolve) => {
        const lookupHost = `${reversedIP}.${server.host}`;
        dns.resolve4(lookupHost, (err, addresses) => {
            if (err) {
                // NXDOMAIN = not listed (good)
                resolve({ listed: false });
            } else {
                // Got a response = listed (bad)
                resolve({ listed: true, response: addresses[0] });
            }
        });
    });
}

module.exports = exports;
