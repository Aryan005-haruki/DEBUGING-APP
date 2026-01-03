/**
 * PHASE 2: File Upload Scanner
 * Checks for file upload security issues
 */

/**
 * Scan for file upload vulnerabilities
 * @param {string} url - Website URL
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Scan results
 */
exports.scan = (url, pageData) => {
    const issues = [];
    const findings = {
        uploadForms: [],
        acceptAttributes: [],
        validation: {
            clientSide: false,
            fileType: false,
            fileSize: false
        }
    };

    try {
        const html = pageData.html || '';

        // 1. Find file upload inputs
        const fileInputPattern = /<input[^>]*type\s*=\s*["']file["'][^>]*>/gi;
        const fileInputs = html.match(fileInputPattern) || [];

        if (fileInputs.length === 0) {
            // No file uploads, perfect score
            return {
                findings,
                issues: [],
                score: 100,
                summary: {
                    uploadFormsFound: 0,
                    hasValidation: false
                }
            };
        }

        findings.uploadForms = fileInputs;

        // 2. Check each file input for security measures
        for (let i = 0; i < fileInputs.length; i++) {
            const input = fileInputs[i];

            // Check for accept attribute
            const acceptMatch = input.match(/accept\s*=\s*["']([^"']+)["']/i);

            if (acceptMatch) {
                findings.acceptAttributes.push(acceptMatch[1]);
                findings.validation.fileType = true;
            } else {
                issues.push({
                    id: `upload-001-${i}`,
                    severity: 'CRITICAL',
                    title: 'File Upload Without Type Restriction',
                    description: 'File input lacks "accept" attribute to restrict file types',
                    impact: 'Users can upload executable files and malware',
                    category: 'File Upload Security'
                });
            }

            // Check for dangerous file types in accept
            if (acceptMatch) {
                const dangerousTypes = ['.exe', '.bat', '.cmd', '.sh', '.php', '.asp', '.jsp'];
                const acceptValue = acceptMatch[1].toLowerCase();

                if (dangerousTypes.some(type => acceptValue.includes(type))) {
                    issues.push({
                        id: `upload-002-${i}`,
                        severity: 'CRITICAL',
                        title: 'Allows Executable File Upload',
                        description: 'File input accepts dangerous executable file types',
                        impact: 'Attackers can upload and potentially execute malicious code',
                        category: 'File Upload Security'
                    });
                }
            }
        }

        // 3. Check for client-side validation
        const validationPatterns = [
            /validate.*file/i,
            /file.*size/i,
            /file.*type/i,
            /allowed.*extensions/i,
            /max.*size/i,
            /file.*validation/i
        ];

        findings.validation.clientSide = validationPatterns.some(pattern => pattern.test(html));

        if (!findings.validation.clientSide) {
            issues.push({
                id: 'upload-003',
                severity: 'WARNING',
                title: 'No Client-Side File Validation',
                description: 'No visible JavaScript validation for file uploads',
                impact: 'Users may upload invalid files, wasting bandwidth',
                category: 'File Upload Security'
            });
        }

        // 4. Check for file size limits
        const sizeLimitPatterns = [
            /max.*file.*size/i,
            /size.*limit/i,
            /maximum.*\d+\s*(MB|KB|GB)/i,
            /file.*must.*less.*than/i
        ];

        findings.validation.fileSize = sizeLimitPatterns.some(pattern => pattern.test(html));

        if (!findings.validation.fileSize) {
            issues.push({
                id: 'upload-004',
                severity: 'WARNING',
                title: 'No Visible File Size Limit',
                description: 'No indication of maximum file size limit',
                impact: 'Users may upload very large files, causing DoS',
                category: 'File Upload Security'
            });
        }

        // 5. Check form enctype
        const formPattern = /<form[^>]*>(.*?)<\/form>/gis;
        const forms = html.match(formPattern) || [];

        for (const form of forms) {
            if (form.includes('type="file"')) {
                // Check if form has correct enctype
                if (!form.includes('multipart/form-data')) {
                    issues.push({
                        id: 'upload-005',
                        severity: 'WARNING',
                        title: 'File Upload Form Missing Proper Encoding',
                        description: 'Form with file input lacks enctype="multipart/form-data"',
                        impact: 'File uploads may fail',
                        category: 'File Upload Security'
                    });
                }
            }
        }

        // 6. Check for upload directory security mentions
        const uploadPathPatterns = [
            /upload.*directory/i,
            /upload.*folder/i,
            /\/uploads\//i,
            /\/files\//i
        ];

        const exposedPaths = uploadPathPatterns.some(pattern => pattern.test(html));

        if (exposedPaths) {
            issues.push({
                id: 'upload-006',
                severity: 'WARNING',
                title: 'Upload Directory Path Exposed',
                description: 'Upload directory path is visible in page source',
                impact: 'Attackers can enumerate uploaded files',
                category: 'File Upload Security'
            });
        }

        // 7. Check for antivirus/malware scanning mentions
        const securityScanning = [
            /virus.*scan/i,
            /malware.*scan/i,
            /file.*scan/i,
            /security.*check/i
        ];

        const hasSecurityScanning = securityScanning.some(pattern => pattern.test(html));

        if (!hasSecurityScanning && fileInputs.length > 0) {
            issues.push({
                id: 'upload-007',
                severity: 'WARNING',
                title: 'No Malware Scanning Mentioned',
                description: 'No indication of virus/malware scanning on uploads',
                impact: 'Uploaded files may contain malware',
                category: 'File Upload Security'
            });
        }

        // Calculate score
        let score = 100;
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const warningCount = issues.filter(i => i.severity === 'WARNING').length;

        score -= (criticalCount * 25);
        score -= (warningCount * 10);
        score = Math.max(0, score);

        return {
            findings,
            issues,
            score,
            summary: {
                uploadFormsFound: fileInputs.length,
                hasTypeValidation: findings.validation.fileType,
                hasClientValidation: findings.validation.clientSide,
                hasSizeLimit: findings.validation.fileSize
            }
        };

    } catch (error) {
        console.error('File upload scan error:', error.message);
        return {
            findings,
            issues: [],
            score: null,
            error: error.message
        };
    }
};

module.exports = exports;
