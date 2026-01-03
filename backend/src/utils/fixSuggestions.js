/**
 * Database of fix suggestions for common issues
 * Each suggestion includes a summary and step-by-step instructions
 */

module.exports = {
    // Performance-related fixes
    performance: {
        overall: {
            summary: 'Optimize website performance for faster load times',
            steps: [
                'Compress and optimize all images (use WebP format)',
                'Enable browser caching with proper cache headers',
                'Minify CSS, JavaScript, and HTML',
                'Use a Content Delivery Network (CDN)',
                'Enable GZIP compression on your server',
                'Reduce server response time',
                'Eliminate render-blocking resources'
            ],
            resources: [
                'https://web.dev/performance-scoring/',
                'https://developers.google.com/speed/docs/insights/rules'
            ]
        },
        render_blocking_resources: {
            summary: 'Remove render-blocking JavaScript and CSS',
            steps: [
                'Inline critical CSS in the HTML',
                'Defer non-critical CSS using media queries',
                'Add async or defer attributes to script tags',
                'Load JavaScript at the end of the body tag',
                'Use code splitting to reduce initial bundle size'
            ],
            resources: ['https://web.dev/render-blocking-resources/']
        },
        unused_css_rules: {
            summary: 'Remove unused CSS to reduce file size',
            steps: [
                'Use tools like PurgeCSS or UnCSS to remove unused styles',
                'Split CSS files by page or component',
                'Use CSS-in-JS or CSS modules for better tree-shaking',
                'Regularly audit and clean up old stylesheets'
            ],
            resources: ['https://web.dev/unused-css-rules/']
        },
        unused_javascript: {
            summary: 'Reduce unused JavaScript',
            steps: [
                'Use code splitting to load only necessary code',
                'Implement lazy loading for components',
                'Remove unused libraries and dependencies',
                'Use tree-shaking in your build process',
                'Analyze bundle with webpack-bundle-analyzer'
            ],
            resources: ['https://web.dev/remove-unused-code/']
        },
        modern_image_formats: {
            summary: 'Use modern image formats like WebP',
            steps: [
                'Convert images to WebP format',
                'Use <picture> element with fallbacks',
                'Implement responsive images with srcset',
                'Compress images without losing quality',
                'Consider using SVG for icons and logos'
            ],
            resources: ['https://web.dev/uses-webp-images/']
        }
    },

    // SEO-related fixes
    seo: {
        overall: {
            summary: 'Improve SEO for better search engine visibility',
            steps: [
                'Add descriptive title tags (50-60 characters)',
                'Write compelling meta descriptions (150-160 characters)',
                'Use proper heading hierarchy (H1, H2, H3)',
                'Add alt text to all images',
                'Create an XML sitemap and submit to search engines',
                'Ensure mobile-friendliness',
                'Improve page load speed',
                'Use schema markup for rich snippets'
            ],
            resources: [
                'https://developers.google.com/search/docs',
                'https://web.dev/lighthouse-seo/'
            ]
        },
        meta_description: {
            summary: 'Add compelling meta descriptions',
            steps: [
                'Add <meta name="description" content="..."> in <head>',
                'Keep it between 150-160 characters',
                'Include relevant keywords naturally',
                'Make it compelling to encourage clicks',
                'Make each page\'s description unique'
            ],
            resources: ['https://web.dev/meta-description/']
        }
    },

    // Accessibility fixes
    accessibility: {
        overall: {
            summary: 'Improve accessibility for all users',
            steps: [
                'Add alt text to all images',
                'Ensure sufficient color contrast (4.5:1 minimum)',
                'Make all interactive elements keyboard accessible',
                'Use semantic HTML elements',
                'Add ARIA labels where needed',
                'Provide captions for videos',
                'Test with screen readers',
                'Ensure form labels are properly associated'
            ],
            resources: [
                'https://web.dev/accessibility/',
                'https://www.w3.org/WAI/WCAG21/quickref/'
            ]
        },
        color_contrast: {
            summary: 'Increase color contrast to meet WCAG standards',
            steps: [
                'Ensure contrast ratio is at least 4.5:1 for normal text',
                'Ensure contrast ratio is at least 3:1 for large text',
                'Use tools like WebAIM Contrast Checker',
                'Test with different color blindness simulations',
                'Avoid using color as the only visual cue'
            ],
            resources: ['https://webaim.org/resources/contrastchecker/']
        }
    },


    // Security fixes
    security: {
        overall: {
            summary: 'Implement comprehensive security best practices',
            steps: [
                'Enable HTTPS with valid SSL certificate',
                'Configure all security headers (CSP, HSTS, X-Frame-Options)',
                'Implement CSRF protection on all state-changing forms',
                'Use parameterized queries to prevent SQL injection',
                'Sanitize all user input to prevent XSS attacks',
                'Secure session management with HttpOnly and Secure cookies',
                'Regular security audits and vulnerability scans',
                'Keep all software and dependencies up-to-date'
            ],
            resources: [
                'https://owasp.org/www-project-top-ten/',
                'https://web.dev/secure/'
            ]
        },
        https: {
            summary: 'Enable HTTPS with a free SSL certificate',
            steps: [
                'Get a free SSL certificate from Let\'s Encrypt',
                'Configure your web server to use HTTPS',
                'Redirect all HTTP traffic to HTTPS',
                'Update all internal links to use HTTPS',
                'Add HSTS header for enhanced security',
                'Update sitemap and submit to search engines'
            ],
            resources: [
                'https://letsencrypt.org/getting-started/',
                'https://web.dev/why-https-matters/'
            ]
        },
        ssl: {
            summary: 'Fix SSL/TLS configuration issues',
            steps: [
                'Renew expired certificates immediately',
                'Use certificates from trusted CAs (avoid self-signed)',
                'Enable TLS 1.2 and TLS 1.3 only, disable older versions',
                'Configure strong cipher suites (AES-GCM, ChaCha20)',
                'Enable HSTS with includeSubDomains and preload',
                'Fix certificate chain issues',
                'Test configuration with SSL Labs (ssllabs.com/ssltest)'
            ],
            resources: [
                'https://ssl-config.mozilla.org/',
                'https://www.ssllabs.com/ssltest/'
            ]
        },
        headers: {
            summary: 'Configure security headers properly',
            steps: [
                'Add Content-Security-Policy header (start with strict policy)',
                'Set X-Frame-Options: DENY or SAMEORIGIN',
                'Add X-Content-Type-Options: nosniff',
                'Set Strict-Transport-Security: max-age=31536000; includeSubDomains',
                'Configure Referrer-Policy: no-referrer or strict-origin-when-cross-origin',
                'Add Permissions-Policy header to control browser features',
                'Remove server version from Server header',
                'Test headers with securityheaders.com'
            ],
            resources: [
                'https://securityheaders.com/',
                'https://content-security-policy.com/'
            ]
        },
        xss: {
            summary: 'Prevent Cross-Site Scripting (XSS) attacks',
            steps: [
                'Implement strict Content-Security-Policy header',
                'Encode all user input before displaying in HTML',
                'Use textContent instead of innerHTML when possible',
                'Validate and sanitize input on both client and server',
                'Avoid using eval(), setTimeout() with strings, or Function()',
                'Use templating engines that auto-escape by default',
                'Enable X-XSS-Protection: 1; mode=block header',
                'Test with XSS payloads in a safe environment'
            ],
            resources: [
                'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
                'https://portswigger.net/web-security/cross-site-scripting'
            ]
        },
        csrf: {
            summary: 'Implement CSRF protection mechanisms',
            steps: [
                'Add anti-CSRF tokens to all state-changing forms',
                'Verify CSRF tokens on server-side for all POST/PUT/DELETE requests',
                'Set SameSite=Lax or SameSite=Strict on session cookies',
                'Use Double Submit Cookie pattern for AJAX requests',
                'Require custom headers (X-Requested-With) for AJAX',
                'Check Origin and Referer headers',
                'Implement proper session management',
                'Use framework built-in CSRF protection'
            ],
            resources: [
                'https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html',
                'https://owasp.org/www-community/attacks/csrf'
            ]
        },
        sqlInjection: {
            summary: 'Prevent SQL Injection vulnerabilities',
            steps: [
                'Use parameterized queries (prepared statements) ALWAYS',
                'Never concatenate user input into SQL queries',
                'Use ORM frameworks with built-in protection',
                'Validate and sanitize all user input',
                'Use stored procedures with parameterized inputs',
                'Apply principle of least privilege to database accounts',
                'Disable detailed error messages in production',
                'Regularly scan for SQL injection vulnerabilities'
            ],
            resources: [
                'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
                'https://owasp.org/www-community/attacks/SQL_Injection'
            ]
        },
        sensitiveData: {
            summary: 'Protect sensitive data from exposure',
            steps: [
                'Never commit API keys or credentials to source control',
                'Use environment variables for sensitive configuration',
                'Implement .gitignore to exclude config files',
                'Rotate exposed API keys immediately',
                'Use secrets management tools (Vault, AWS Secrets Manager)',
                'Encrypt sensitive data at rest and in transit',
                'Remove comments containing sensitive information',
                'Scan repositories for exposed secrets regularly'
            ],
            resources: [
                'https://github.com/zricethezav/gitleaks',
                'https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure'
            ]
        },
        authentication: {
            summary: 'Strengthen authentication and session security',
            steps: [
                'Enforce strong password policies (8+ chars, mixed case, numbers, symbols)',
                'Implement multi-factor authentication (MFA/2FA)',
                'Use Secure and HttpOnly flags on session cookies',
                'Set SameSite=Strict on authentication cookies',
                'Implement account lockout after failed login attempts',
                'Use bcrypt, scrypt, or Argon2 for password hashing',
                'Implement proper session timeout and renewal',
                'Always transmit credentials over HTTPS only'
            ],
            resources: [
                'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
                'https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html'
            ]
        },
        fileUpload: {
            summary: 'Secure file upload functionality',
            steps: [
                'Validate file types using MIME type AND file extension',
                'Restrict upload size to reasonable limits',
                'Store uploaded files outside web root directory',
                'Rename uploaded files to prevent directory traversal',
                'Scan uploads for malware using antivirus',
                'Never allow executable file types (.exe, .php, .asp, .jsp)',
                'Serve uploaded files with Content-Disposition: attachment',
                'Implement rate limiting on upload endpoints'
            ],
            resources: [
                'https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html',
                'https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload'
            ]
        }
    },


    // Broken links
    brokenLinks: {
        summary: 'Fix or remove broken links',
        steps: [
            'Review the list of broken links',
            'Update outdated URLs to current ones',
            'Remove links to deleted pages',
            'Set up 301 redirects for moved content',
            'Fix typos in URLs',
            'Regularly monitor for new broken links',
            'Consider using a 404 page with helpful navigation'
        ],
        resources: ['https://web.dev/http-status-code/']
    },

    // APK-specific fixes
    apk: {
        size: {
            summary: 'Reduce APK size using optimization techniques',
            steps: [
                'Use Android App Bundle (.aab) instead of APK for Play Store',
                'Enable ProGuard/R8 code shrinking and obfuscation',
                'Enable resource shrinking with shrinkResources=true',
                'Compress images and use WebP format',
                'Remove unused resources and libraries',
                'Use vector drawables instead of PNG where possible',
                'Split APKs by ABI (armeabi-v7a, arm64-v8a, x86)',
                'Avoid duplicating libraries in lib folders'
            ],
            resources: [
                'https://developer.android.com/topic/performance/reduce-apk-size',
                'https://developer.android.com/guide/app-bundle'
            ]
        },
        permissions: {
            summary: 'Request only necessary permissions',
            steps: [
                'Review AndroidManifest.xml and remove unused permissions',
                'Request dangerous permissions at runtime, not in manifest',
                'Provide clear explanations for why permissions are needed',
                'Use permission groups to reduce user concerns',
                'Consider privacy-friendly alternatives (e.g., SAF instead of storage)',
                'Implement proper permission denial handling',
                'Follow principle of least privilege'
            ],
            resources: [
                'https://developer.android.com/training/permissions/requesting',
                'https://developer.android.com/guide/topics/permissions/overview'
            ]
        },
        sdk: {
            summary: 'Update SDK versions to latest recommendations',
            steps: [
                'Update minSdkVersion to at least 21 (Android 5.0 Lollipop)',
                'Update targetSdkVersion to 34 (Android 14) or latest',
                'Review behavior changes for new API levels',
                'Update deprecated APIs to modern alternatives',
                'Test thoroughly on devices running new Android versions',
                'Update build.gradle (Module: app) with new SDK versions',
                'Follow Android\'s yearly targetSdk requirements for Play Store'
            ],
            resources: [
                'https://developer.android.com/distribute/best-practices/develop/target-sdk',
                'https://developer.android.com/about/versions/14/behavior-changes-all'
            ]
        },
        deprecated_apis: {
            summary: 'Replace deprecated APIs with modern alternatives',
            steps: [
                'Replace AsyncTask with Kotlin Coroutines, Executors, or WorkManager',
                'Replace HttpClient with OkHttp or Retrofit',
                'Use AndroidX libraries instead of Support Library',
                'Replace getColor(int) with ContextCompat.getColor()',
                'Update to Scoped Storage instead of WRITE_EXTERNAL_STORAGE',
                'Check Android Studio warnings for deprecated usage',
                'Follow migration guides in Android documentation'
            ],
            resources: [
                'https://developer.android.com/reference',
                'https://developer.android.com/jetpack/androidx/migrate'
            ]
        }
    }
};
