const { SiteChecker } = require('broken-link-checker');

/**
 * Check for broken links on a website
 */
exports.analyze = async (url) => {
    return new Promise((resolve) => {
        const brokenLinks = [];
        const excludedLinks = [];
        let pagesScanned = 0;

        const checker = new SiteChecker({
            excludeExternalLinks: false,
            filterLevel: 1,
            honorRobotExclusions: false,
            maxSocketsPerHost: 2,
            rateLimit: 50
        }, {
            link: (result) => {
                if (result.broken) {
                    brokenLinks.push({
                        url: result.url.resolved,
                        baseUrl: result.base.resolved,
                        statusCode: result.http.response?.statusCode,
                        reason: result.brokenReason
                    });
                }
            },
            page: (error, pageUrl) => {
                pagesScanned++;
                // Limit to 10 pages for performance
                if (pagesScanned >= 10) {
                    checker.pause();
                    setTimeout(() => {
                        resolve({
                            brokenLinks: brokenLinks.slice(0, 20), // Limit to 20 broken links
                            pagesScanned,
                            totalBrokenLinks: brokenLinks.length
                        });
                    }, 1000);
                }
            },
            end: () => {
                resolve({
                    brokenLinks: brokenLinks.slice(0, 20),
                    pagesScanned,
                    totalBrokenLinks: brokenLinks.length
                });
            }
        });

        // Make sure URL has protocol
        const fullUrl = url.startsWith('http') ? url : `https://${url}`;

        checker.enqueue(fullUrl);

        // Timeout after 30 seconds
        setTimeout(() => {
            checker.pause();
            resolve({
                brokenLinks: brokenLinks.slice(0, 20),
                pagesScanned,
                totalBrokenLinks: brokenLinks.length,
                timeout: true
            });
        }, 30000);
    });
};

module.exports = exports;
