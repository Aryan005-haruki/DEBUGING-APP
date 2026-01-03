const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const RobotsParser = require('robots-parser');
const axios = require('axios');
const { URL } = require('url');

/**
 * PHASE 1: Enhanced Website Crawling Engine
 * Smart Crawler with JavaScript rendering support
 */

const DEFAULT_CONFIG = {
    maxDepth: 5,
    maxPages: 100,
    timeout: 30000, // 30 seconds per page
    respectRobotsTxt: true,
    userAgent: 'HealthChecker-Bot/1.0 (https://healthchecker.app)',
    concurrency: 3,
    screenshotEnabled: true,
    headless: true
};

class WebsiteCrawler {
    constructor(startUrl, config = {}) {
        this.startUrl = this.normalizeUrl(startUrl);
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.visitedUrls = new Set();
        this.crawlQueue = [];
        this.results = new Map();
        this.robotsParser = null;
        this.browser = null;
        this.crawlId = this.generateCrawlId();
        this.startTime = null;
    }

    generateCrawlId() {
        return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    normalizeUrl(url) {
        try {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            const urlObj = new URL(url);
            // Remove trailing slash for consistency
            return urlObj.href.replace(/\/$/, '');
        } catch (error) {
            throw new Error(`Invalid URL: ${url}`);
        }
    }

    getDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        } catch (error) {
            return null;
        }
    }

    isInternalUrl(url) {
        const startDomain = this.getDomain(this.startUrl);
        const targetDomain = this.getDomain(url);
        return startDomain === targetDomain;
    }

    async loadRobotsTxt() {
        try {
            const urlObj = new URL(this.startUrl);
            const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

            const response = await axios.get(robotsUrl, {
                timeout: 5000,
                headers: { 'User-Agent': this.config.userAgent }
            });

            this.robotsParser = RobotsParser(robotsUrl, response.data);
            console.log(`✅ Loaded robots.txt from ${robotsUrl}`);
        } catch (error) {
            console.log(`⚠️ Could not load robots.txt: ${error.message}`);
            // If robots.txt doesn't exist, allow all
            this.robotsParser = null;
        }
    }

    isAllowedByRobots(url) {
        if (!this.config.respectRobotsTxt || !this.robotsParser) {
            return true;
        }
        return this.robotsParser.isAllowed(url, this.config.userAgent);
    }

    async crawl() {
        this.startTime = Date.now();
        console.log(`🚀 Starting crawl: ${this.startUrl}`);
        console.log(`📋 Config: maxDepth=${this.config.maxDepth}, maxPages=${this.config.maxPages}`);

        try {
            // Load robots.txt
            await this.loadRobotsTxt();

            // Launch browser
            this.browser = await puppeteer.launch({
                headless: this.config.headless,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
            });

            // Add start URL to queue
            this.crawlQueue.push({ url: this.startUrl, depth: 0, parentUrl: null });

            // Process queue
            while (this.crawlQueue.length > 0 && this.visitedUrls.size < this.config.maxPages) {
                const { url, depth, parentUrl } = this.crawlQueue.shift();

                // Skip if already visited
                if (this.visitedUrls.has(url)) {
                    continue;
                }

                // Skip if max depth exceeded
                if (depth > this.config.maxDepth) {
                    continue;
                }

                // Skip if not allowed by robots.txt
                if (!this.isAllowedByRobots(url)) {
                    console.log(`🚫 Blocked by robots.txt: ${url}`);
                    continue;
                }

                // Crawl the page
                await this.crawlPage(url, depth, parentUrl);
            }

            await this.browser.close();

            const crawlDuration = Date.now() - this.startTime;
            console.log(`✅ Crawl completed: ${this.visitedUrls.size} pages in ${(crawlDuration / 1000).toFixed(2)}s`);

            return this.generateReport();

        } catch (error) {
            if (this.browser) {
                await this.browser.close();
            }
            throw error;
        }
    }

    async crawlPage(url, depth, parentUrl) {
        console.log(`📄 Crawling [${depth}]: ${url}`);

        const page = await this.browser.newPage();

        try {
            // Set user agent
            await page.setUserAgent(this.config.userAgent);

            // Set viewport for consistent screenshots
            await page.setViewport({ width: 1920, height: 1080 });

            const startTime = Date.now();

            // Navigate to page with timeout
            const response = await page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: this.config.timeout
            });

            const loadTime = Date.now() - startTime;

            // Mark as visited
            this.visitedUrls.add(url);

            // Get page data
            const pageData = await this.extractPageData(page, url, response, loadTime, depth, parentUrl);

            // Store results
            this.results.set(url, pageData);

            // Extract and queue links for next depth
            if (depth < this.config.maxDepth) {
                for (const link of pageData.links.internal) {
                    if (!this.visitedUrls.has(link) && this.visitedUrls.size < this.config.maxPages) {
                        this.crawlQueue.push({ url: link, depth: depth + 1, parentUrl: url });
                    }
                }
            }

        } catch (error) {
            console.error(`❌ Error crawling ${url}:`, error.message);
            this.results.set(url, {
                url,
                error: error.message,
                depth,
                parentUrl,
                crawledAt: new Date().toISOString()
            });
        } finally {
            await page.close();
        }
    }

    async extractPageData(page, url, response, loadTime, depth, parentUrl) {
        const $ = cheerio.load(await page.content());

        // Extract meta tags
        const metaTags = {};
        $('meta').each((i, elem) => {
            const name = $(elem).attr('name') || $(elem).attr('property');
            const content = $(elem).attr('content');
            if (name && content) {
                metaTags[name] = content;
            }
        });

        // Extract links
        const links = { internal: [], external: [] };
        $('a[href]').each((i, elem) => {
            try {
                const href = $(elem).attr('href');
                const absoluteUrl = new URL(href, url).href.replace(/\/$/, '');

                if (this.isInternalUrl(absoluteUrl)) {
                    if (!links.internal.includes(absoluteUrl)) {
                        links.internal.push(absoluteUrl);
                    }
                } else {
                    if (!links.external.includes(absoluteUrl)) {
                        links.external.push(absoluteUrl);
                    }
                }
            } catch (e) {
                // Invalid URL, skip
            }
        });

        // Extract resources
        const cssFiles = [];
        $('link[rel="stylesheet"]').each((i, elem) => {
            const href = $(elem).attr('href');
            if (href) {
                try {
                    cssFiles.push(new URL(href, url).href);
                } catch (e) { }
            }
        });

        const jsFiles = [];
        $('script[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            if (src) {
                try {
                    jsFiles.push(new URL(src, url).href);
                } catch (e) { }
            }
        });

        const images = [];
        $('img[src]').each((i, elem) => {
            const src = $(elem).attr('src');
            const alt = $(elem).attr('alt') || '';
            if (src) {
                try {
                    images.push({
                        url: new URL(src, url).href,
                        alt: alt
                    });
                } catch (e) { }
            }
        });

        // Extract headings
        const headings = { h1: [], h2: [], h3: [], h4: [], h5: [], h6: [] };
        ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            $(tag).each((i, elem) => {
                headings[tag].push($(elem).text().trim());
            });
        });

        // Get response headers
        const headers = response.headers();

        // Take screenshot
        let screenshot = null;
        if (this.config.screenshotEnabled) {
            try {
                screenshot = await page.screenshot({
                    encoding: 'base64',
                    fullPage: false,
                    type: 'jpeg',
                    quality: 60
                });
            } catch (e) {
                console.error('Screenshot failed:', e.message);
            }
        }

        return {
            url,
            title: await page.title(),
            depth,
            parentUrl,
            statusCode: response.status(),
            loadTime,
            crawledAt: new Date().toISOString(),
            meta: metaTags,
            headings,
            links,
            resources: {
                css: cssFiles,
                js: jsFiles,
                images: images.slice(0, 50) // Limit to 50 images
            },
            headers: {
                contentType: headers['content-type'],
                server: headers['server'],
                cacheControl: headers['cache-control'],
                xFrameOptions: headers['x-frame-options'],
                strictTransportSecurity: headers['strict-transport-security']
            },
            screenshot: screenshot ? `data:image/jpeg;base64,${screenshot.substring(0, 100)}...` : null // Store reference only
        };
    }

    generateReport() {
        const sitemap = {};

        this.results.forEach((pageData, url) => {
            const path = url.replace(this.startUrl, '') || '/';
            sitemap[path] = {
                url: pageData.url,
                title: pageData.title,
                depth: pageData.depth,
                links: pageData.links?.internal || [],
                resources: pageData.resources ? {
                    cssCount: pageData.resources.css?.length || 0,
                    jsCount: pageData.resources.js?.length || 0,
                    imageCount: pageData.resources.images?.length || 0
                } : {},
                loadTime: pageData.loadTime,
                statusCode: pageData.statusCode,
                error: pageData.error || null
            };
        });

        return {
            crawlId: this.crawlId,
            website: this.startUrl,
            totalPages: this.visitedUrls.size,
            crawledAt: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            config: {
                maxDepth: this.config.maxDepth,
                maxPages: this.config.maxPages,
                respectRobotsTxt: this.config.respectRobotsTxt
            },
            sitemap,
            statistics: {
                totalLinks: Array.from(this.results.values()).reduce((sum, page) =>
                    sum + (page.links?.internal.length || 0) + (page.links?.external.length || 0), 0),
                totalImages: Array.from(this.results.values()).reduce((sum, page) =>
                    sum + (page.resources?.images.length || 0), 0),
                avgLoadTime: Array.from(this.results.values())
                    .filter(page => page.loadTime)
                    .reduce((sum, page, i, arr) => sum + page.loadTime / arr.length, 0)
            }
        };
    }
}

/**
 * Main export function
 */
exports.crawlWebsite = async (url, options = {}) => {
    const crawler = new WebsiteCrawler(url, options);
    return await crawler.crawl();
};

module.exports = exports;
