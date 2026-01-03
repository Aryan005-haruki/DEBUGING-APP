/**
 * PHASE 2: SQL Injection Scanner
 * Detects SQL injection vulnerability indicators (passive analysis)
 */

/**
 * Scan for SQL injection vulnerabilities
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Scan results
 */
exports.scan = (url, pageData) => {
    const issues = [];
    const findings = {
        errorMessages: [],
        suspiciousPatterns: [],
        vulnParams: []
    };

    try {
        const html = pageData.html || '';

        // 1. Check for SQL error messages in HTML
        const sqlErrorPatterns = [
            /SQL syntax.*MySQL/i,
            /Warning.*mysql_/i,
            /valid MySQL result/i,
            /MySqlClient\./i,
            /PostgreSQL.*ERROR/i,
            /Warning.*pg_/i,
            /valid PostgreSQL result/i,
            /Npgsql\./i,
            /Driver.*SQL.*Server/i,
            /OLE DB.*SQL Server/i,
            /SQLServer JDBC Driver/i,
            /Oracle.*ORA-\d+/i,
            /Microsoft.*ODBC.*SQL/i,
            /SQLite\/JDBCDriver/i,
            /System\.Data\.SQLite/i,
            /Unclosed quotation mark/i,
            /quoted string not properly terminated/i
        ];

        for (const pattern of sqlErrorPatterns) {
            const matches = html.match(pattern);
            if (matches) {
                findings.errorMessages.push(matches[0]);

                issues.push({
                    id: `sql-error-${findings.errorMessages.length}`,
                    severity: 'CRITICAL',
                    title: 'SQL Error Message Exposed',
                    description: 'Database error message found in page content',
                    impact: 'Reveals database structure and confirms SQL injection vulnerability',
                    category: 'SQL Injection',
                    details: {
                        errorSnippet: matches[0].substring(0, 100)
                    }
                });

                break; // Report once for errors
            }
        }

        // 2. Check URL parameters for SQL injection patterns
        const urlObj = new URL(url);
        const params = urlObj.searchParams;

        for (const [key, value] of params) {
            // Check if parameter looks like it might be used in SQL
            const sqlKeywords = ['id', 'user', 'page', 'cat', 'category', 'product', 'item', 'search', 'query'];
            const lowerKey = key.toLowerCase();

            if (sqlKeywords.some(keyword => lowerKey.includes(keyword))) {
                // Check if value is numeric or has SQL-like patterns
                if (/^\d+$/.test(value) || /['"\\;]/.test(value)) {
                    findings.vulnParams.push(key);

                    issues.push({
                        id: `sql-param-${key}`,
                        severity: 'WARNING',
                        title: 'Potential SQL Injection Parameter',
                        description: `URL parameter "${key}" may be vulnerable to SQL injection`,
                        impact: 'If not properly sanitized, could allow database manipulation',
                        category: 'SQL Injection',
                        details: {
                            parameter: key,
                            recommendation: 'Use parameterized queries and input validation'
                        }
                    });
                }
            }
        }

        // 3. Check for suspicious SQL patterns in HTML/JavaScript
        const suspiciousPatterns = [
            /SELECT\s+.*\s+FROM\s+/gi,
            /INSERT\s+INTO\s+/gi,
            /UPDATE\s+.*\s+SET\s+/gi,
            /DELETE\s+FROM\s+/gi,
            /DROP\s+TABLE/gi,
            /UNION\s+SELECT/gi,
            /'.*OR.*'.*='/gi,
            /".*OR.*".*="/gi
        ];

        for (const pattern of suspiciousPatterns) {
            if (pattern.test(html)) {
                findings.suspiciousPatterns.push(pattern.source);
            }
        }

        if (findings.suspiciousPatterns.length > 0) {
            issues.push({
                id: 'sql-pattern-001',
                severity: 'WARNING',
                title: 'SQL Query Patterns in Source',
                description: 'Found SQL-like patterns in page source code',
                impact: 'May indicate exposed queries or client-side SQL injection risks',
                category: 'SQL Injection',
                details: {
                    patterns: findings.suspiciousPatterns.slice(0, 3)
                }
            });
        }

        // 4. Check for forms with suspicious action parameters
        const formPattern = /<form[^>]*action\s*=\s*["']([^"']+)["'][^>]*>/gi;
        const forms = [];
        let match;

        while ((match = formPattern.exec(html)) !== null) {
            const action = match[1];

            // Check if action URL has parameters that might be vulnerable
            if (action.includes('?')) {
                const actionUrl = new URL(action, url);
                const actionParams = actionUrl.searchParams;

                for (const [key] of actionParams) {
                    if (['id', 'user', 'query'].some(kw => key.toLowerCase().includes(kw))) {
                        forms.push({ action, parameter: key });
                    }
                }
            }
        }

        if (forms.length > 0) {
            issues.push({
                id: 'sql-form-001',
                severity: 'WARNING',
                title: 'Forms With Potentially Vulnerable Parameters',
                description: `Found ${forms.length} form(s) with parameters that may be SQL injection targets`,
                impact: 'Forms should use parameterized queries to prevent SQL injection',
                category: 'SQL Injection',
                details: {
                    formCount: forms.length
                }
            });
        }

        // 5. Check for database connection strings in source
        const dbConnectionPatterns = [
            /server\s*=.*;.*database\s*=/i,
            /data\s+source\s*=.*;.*initial\s+catalog/i,
            /mongodb:\/\//i,
            /mysql:\/\//i,
            /postgresql:\/\//i
        ];

        for (const pattern of dbConnectionPatterns) {
            if (pattern.test(html)) {
                issues.push({
                    id: 'sql-conn-001',
                    severity: 'CRITICAL',
                    title: 'Database Connection String Exposed',
                    description: 'Found database connection string in page source',
                    impact: 'Exposes database credentials and location',
                    category: 'SQL Injection'
                });
                break;
            }
        }

        // Calculate score
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        let score = 100;
        score -= (criticalCount * 30);
        score -= (warningCount * 10);
        score = Math.max(0, score);

        return {
            findings,
            issues,
            score,
            summary: {
                errorMessagesFound: findings.errorMessages.length > 0,
                vulnerableParamsDetected: findings.vulnParams.length,
                suspiciousPatternsFound: findings.suspiciousPatterns.length
            }
        };

    } catch (error) {
        console.error('SQL injection scan error:', error.message);
        return {
            findings,
            issues: [],
            score: null,
            error: error.message
        };
    }
};

module.exports = exports;
