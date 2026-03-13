/**
 * Serverless-compatible browser launcher
 * Uses @sparticuz/chromium for Vercel/AWS Lambda environments
 * Falls back to standard puppeteer for local/Docker environments
 */

let _browser = null;

async function getBrowser() {
    if (_browser && _browser.isConnected()) {
        return _browser;
    }

    let puppeteer;
    let launchOptions;

    const isVercel = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

    if (isVercel) {
        // Serverless environment: use sparticuz/chromium
        const chromium = require('@sparticuz/chromium');
        puppeteer = require('puppeteer-core');

        chromium.setHeadlessMode = true;
        chromium.setGraphicsMode = false;

        launchOptions = {
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        };
    } else {
        // Local / Docker environment: use full puppeteer
        puppeteer = require('puppeteer');
        launchOptions = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
            ],
        };
    }

    _browser = await puppeteer.launch(launchOptions);
    return _browser;
}

async function closeBrowser() {
    if (_browser) {
        await _browser.close().catch(() => {});
        _browser = null;
    }
}

module.exports = { getBrowser, closeBrowser };
