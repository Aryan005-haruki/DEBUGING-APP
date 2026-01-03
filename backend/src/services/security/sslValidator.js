const https = require('https');
const tls = require('tls');
const { URL } = require('url');

/**
 * PHASE 2: SSL/TLS Validator
 * Validates SSL certificate and TLS configuration
 */

/**
 * Validate SSL certificate and TLS configuration
 * @param {string} url - Website URL to validate
 * @returns {Promise<Object>} Validation results
 */
exports.validate = async (url) => {
    const issues = [];

    try {
        const urlObj = new URL(url);

        // Only validate HTTPS sites
        if (urlObj.protocol !== 'https:') {
            return {
                isHttps: false,
                issues: [{
                    id: 'ssl-001',
                    severity: 'CRITICAL',
                    title: 'HTTPS Not Enabled',
                    description: 'Website is using insecure HTTP protocol instead of HTTPS',
                    impact: 'All data transmitted is unencrypted and can be intercepted by attackers',
                    category: 'SSL/TLS'
                }],
                score: 0
            };
        }

        // Get SSL certificate details
        const certInfo = await getCertificateInfo(urlObj.hostname, urlObj.port || 443);

        // Check certificate validity
        const now = new Date();
        const validFrom = new Date(certInfo.validFrom);
        const validTo = new Date(certInfo.validTo);

        if (now < validFrom) {
            issues.push({
                id: 'ssl-002',
                severity: 'CRITICAL',
                title: 'Certificate Not Yet Valid',
                description: `SSL certificate is not valid until ${validFrom.toLocaleDateString()}`,
                impact: 'Browsers will show security warnings',
                category: 'SSL/TLS'
            });
        }

        if (now > validTo) {
            issues.push({
                id: 'ssl-003',
                severity: 'CRITICAL',
                title: 'Expired SSL Certificate',
                description: `SSL certificate expired on ${validTo.toLocaleDateString()}`,
                impact: 'Browsers will block access with security error',
                category: 'SSL/TLS'
            });
        }

        // Check if expiring soon (within 30 days)
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
            issues.push({
                id: 'ssl-004',
                severity: 'WARNING',
                title: 'Certificate Expiring Soon',
                description: `SSL certificate expires in ${daysUntilExpiry} days`,
                impact: 'Certificate should be renewed to avoid service disruption',
                category: 'SSL/TLS'
            });
        }

        // Check TLS version (TLS 1.2+ required)
        if (certInfo.protocol && certInfo.protocol.includes('TLSv1.0')) {
            issues.push({
                id: 'ssl-005',
                severity: 'CRITICAL',
                title: 'Outdated TLS Protocol',
                description: 'Server supports TLS 1.0 which is deprecated and insecure',
                impact: 'Vulnerable to POODLE and BEAST attacks',
                category: 'SSL/TLS'
            });
        }

        if (certInfo.protocol && certInfo.protocol.includes('TLSv1.1')) {
            issues.push({
                id: 'ssl-006',
                severity: 'WARNING',
                title: 'Weak TLS Protocol',
                description: 'Server supports TLS 1.1 which is deprecated (use TLS 1.2+)',
                impact: 'May be vulnerable to known attacks',
                category: 'SSL/TLS'
            });
        }

        // Check cipher strength
        if (certInfo.cipher) {
            const weakCiphers = ['RC4', 'DES', '3DES', 'MD5'];
            const cipherName = certInfo.cipher.name || '';

            for (const weak of weakCiphers) {
                if (cipherName.includes(weak)) {
                    issues.push({
                        id: 'ssl-007',
                        severity: 'CRITICAL',
                        title: 'Weak Encryption Cipher',
                        description: `Server uses weak cipher: ${cipherName}`,
                        impact: 'Encryption can be broken with modern computing power',
                        category: 'SSL/TLS'
                    });
                    break;
                }
            }
        }

        // Check certificate chain
        if (!certInfo.authorized) {
            issues.push({
                id: 'ssl-008',
                severity: 'CRITICAL',
                title: 'Invalid Certificate Chain',
                description: certInfo.authorizationError || 'Certificate chain validation failed',
                impact: 'Browsers will show "Not Secure" warnings',
                category: 'SSL/TLS'
            });
        }

        // Check for self-signed certificate
        if (certInfo.issuer && certInfo.subject) {
            const issuerCN = certInfo.issuer.CN || '';
            const subjectCN = certInfo.subject.CN || '';

            if (issuerCN === subjectCN) {
                issues.push({
                    id: 'ssl-009',
                    severity: 'CRITICAL',
                    title: 'Self-Signed Certificate',
                    description: 'Website uses a self-signed SSL certificate',
                    impact: 'Browsers will display security warnings to users',
                    category: 'SSL/TLS'
                });
            }
        }

        // Calculate score
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;
        let score = 100 - (criticalCount * 20) - (warningCount * 10);
        score = Math.max(0, Math.min(100, score));

        return {
            isHttps: true,
            certificate: {
                subject: certInfo.subject?.CN || 'Unknown',
                issuer: certInfo.issuer?.CN || 'Unknown',
                validFrom: validFrom.toISOString(),
                validTo: validTo.toISOString(),
                daysUntilExpiry,
                protocol: certInfo.protocol,
                cipher: certInfo.cipher?.name
            },
            issues,
            score
        };

    } catch (error) {
        console.error('SSL validation error:', error.message);
        return {
            isHttps: url.startsWith('https://'),
            issues: [{
                id: 'ssl-error',
                severity: 'WARNING',
                title: 'SSL Validation Failed',
                description: `Unable to validate SSL certificate: ${error.message}`,
                impact: 'Could not verify security of connection',
                category: 'SSL/TLS'
            }],
            score: null,
            error: error.message
        };
    }
};

/**
 * Get SSL certificate information
 * @param {string} hostname - Server hostname
 * @param {number} port - Server port (default 443)
 * @returns {Promise<Object>} Certificate info
 */
function getCertificateInfo(hostname, port = 443) {
    return new Promise((resolve, reject) => {
        const options = {
            host: hostname,
            port: port,
            method: 'GET',
            rejectUnauthorized: false, // Allow self-signed for analysis
            agent: false
        };

        const req = https.request(options, (res) => {
            const certificate = res.socket.getPeerCertificate(true);
            const cipher = res.socket.getCipher();
            const protocol = res.socket.getProtocol();

            resolve({
                subject: certificate.subject,
                issuer: certificate.issuer,
                validFrom: certificate.valid_from,
                validTo: certificate.valid_to,
                authorized: res.socket.authorized,
                authorizationError: res.socket.authorizationError,
                protocol: protocol,
                cipher: cipher
            });

            res.on('data', () => { }); // Consume response
            res.on('end', () => { });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('SSL check timeout'));
        });

        req.end();
    });
}

module.exports = exports;
