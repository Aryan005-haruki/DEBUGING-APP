/**
 * PHASE 2: Sensitive Data Detector
 * Detects exposed sensitive information in page content
 */

/**
 * Regex patterns for sensitive data detection
 */
const PATTERNS = {
    // API Keys and Tokens
    apiKey: {
        pattern: /(api[_-]?key|apikey|api[_-]?token)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]{20,})['"]?/gi,
        name: 'API Key'
    },
    awsKey: {
        pattern: /(AKIA[0-9A-Z]{16})/g,
        name: 'AWS Access Key'
    },
    awsSecret: {
        pattern: /(aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?([a-zA-Z0-9/+=]{40})['"]?/gi,
        name: 'AWS Secret Key'
    },
    githubToken: {
        pattern: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
        name: 'GitHub Token'
    },

    // Database Credentials
    dbPassword: {
        pattern: /(password|passwd|pwd|db[_-]?pass)\s*[:=]\s*['"]([^'"]{3,})['"]/ gi,
        name: 'Database Password'
    },
    connectionString: {
        pattern: /(mongodb|mysql|postgresql|postgres):\/\/[^\s'"]+/gi,
        name: 'Database Connection String'
    },

    // JWT Tokens
    jwt: {
        pattern: /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g,
        name: 'JWT Token'
    },

    // Private Keys
    privateKey: {
        pattern: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g,
        name: 'Private Key'
    },

    // Email Addresses
    email: {
        pattern: /[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,}/g,
        name: 'Email Address'
    },

    // Phone Numbers (international format)
    phone: {
        pattern: /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
        name: 'Phone Number'
    },

    // Internal IP Addresses
    privateIP: {
        pattern: /\b(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b/g,
        name: 'Private IP Address'
    },

    // Google API Keys
    googleApi: {
        pattern: /AIza[0-9A-Za-z_-]{35}/g,
        name: 'Google API Key'
    },

    // Slack Tokens
    slackToken: {
        pattern: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24,}/g,
        name: 'Slack Token'
    }
};

/**
 * Scan page content for sensitive data exposure
 * @param {Object} pageData - Page data including HTML, JS, CSS
 * @returns {Object} Scan results with detected sensitive data
 */
exports.scan = (pageData) => {
    const issues = [];
    const findings = {};

    try {
        // Combine all text sources for scanning
        const sources = {
            html: pageData.html || '',
            scripts: (pageData.resources?.js || []).join('\n'),
            styles: (pageData.resources?.css || []).join('\n'),
            comments: extractHtmlComments(pageData.html || '')
        };

        // Scan each source with all patterns
        for (const [sourceName, sourceContent] of Object.entries(sources)) {
            if (!sourceContent) continue;

            for (const [patternName, patternInfo] of Object.entries(PATTERNS)) {
                const matches = sourceContent.match(patternInfo.pattern);

                if (matches && matches.length > 0) {
                    // Filter out common false positives
                    const validMatches = filterFalsePositives(matches, patternName);

                    if (validMatches.length > 0) {
                        const key = `${patternName}_${sourceName}`;

                        if (!findings[key]) {
                            findings[key] = {
                                type: patternInfo.name,
                                source: sourceName,
                                count: validMatches.length,
                                samples: validMatches.slice(0, 3).map(m => maskSensitiveData(m))
                            };

                            // Determine severity
                            const severity = getSeverity(patternName);

                            issues.push({
                                id: `sensitive-${Object.keys(findings).length}`,
                                severity: severity,
                                title: `${patternInfo.name} Exposed`,
                                description: `Found ${validMatches.length} instance(s) of ${patternInfo.name} in ${sourceName}`,
                                impact: getImpact(patternName),
                                category: 'Sensitive Data Exposure',
                                details: {
                                    type: patternInfo.name,
                                    location: sourceName,
                                    count: validMatches.length,
                                    samples: findings[key].samples
                                }
                            });
                        }
                    }
                }
            }
        }

        // Calculate score
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        let score = 100;
        score -= (criticalCount * 25);
        score -= (warningCount * 10);
        score = Math.max(0, score);

        return {
            issues,
            findings: Object.values(findings),
            score,
            summary: {
                totalFindings: Object.keys(findings).length,
                critical: criticalCount,
                warning: warningCount
            }
        };

    } catch (error) {
        console.error('Sensitive data detection error:', error.message);
        return {
            issues: [],
            findings: [],
            score: null,
            error: error.message
        };
    }
};

/**
 * Extract HTML comments
 */
function extractHtmlComments(html) {
    const commentRegex = /<!--(.*?)-->/gs;
    const matches = html.match(commentRegex) || [];
    return matches.join('\n');
}

/**
 * Filter out false positives
 */
function filterFalsePositives(matches, patternName) {
    const falsePositives = {
        email: ['example@example.com', 'test@test.com', 'admin@localhost'],
        phone: ['123-456-7890', '000-000-0000', '555-555-5555'],
        apiKey: ['YOUR_API_KEY', 'your-api-key-here', 'placeholder']
    };

    if (!falsePositives[patternName]) return matches;

    return matches.filter(match => {
        const lowerMatch = match.toLowerCase();
        return !falsePositives[patternName].some(fp => lowerMatch.includes(fp.toLowerCase()));
    });
}

/**
 * Mask sensitive data for display
 */
function maskSensitiveData(data) {
    if (data.length <= 8) return '****';

    const visible = 4;
    const start = data.substring(0, visible);
    const end = data.substring(data.length - visible);
    return `${start}...${end}`;
}

/**
 * Get severity level for detected data type
 */
function getSeverity(patternName) {
    const critical = ['apiKey', 'awsKey', 'awsSecret', 'githubToken', 'dbPassword',
        'connectionString', 'privateKey', 'jwt', 'slackToken'];

    return critical.includes(patternName) ? 'CRITICAL' : 'WARNING';
}

/**
 * Get impact description
 */
function getImpact(patternName) {
    const impacts = {
        apiKey: 'Exposed API keys can be used by attackers to access your services',
        awsKey: 'AWS credentials can lead to unauthorized access to cloud resources',
        awsSecret: 'AWS secret keys provide full access to your AWS account',
        githubToken: 'GitHub tokens can be used to access private repositories',
        dbPassword: 'Database passwords allow direct access to your data',
        connectionString: 'Connection strings expose database location and credentials',
        jwt: 'JWT tokens can be used to impersonate users',
        privateKey: 'Private keys compromise encryption and authentication',
        email: 'Email addresses can be harvested for spam and phishing',
        phone: 'Phone numbers can be used for spam and social engineering',
        privateIP: 'Internal IPs reveal network architecture',
        googleApi: 'Google API keys can incur charges and access data',
        slackToken: 'Slack tokens provide access to workspace messages'
    };

    return impacts[patternName] || 'Exposed sensitive information poses security risk';
}

module.exports = exports;
