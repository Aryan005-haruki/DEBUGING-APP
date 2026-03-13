/**
 * Social Media Preview Analyzer
 * Checks Open Graph, Twitter Card, and social sharing meta tags
 */
const cheerio = require('cheerio');

function analyzeSocialPreview(targetUrl, pageData) {
    const issues = [];
    let score = 100;
    const html = pageData?.html || '';
    const $ = cheerio.load(html);

    // ── 1. Open Graph Tags ──
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDesc = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogUrl = $('meta[property="og:url"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content');
    const ogSiteName = $('meta[property="og:site_name"]').attr('content');

    if (!ogTitle) {
        issues.push({ id: 'og-no-title', severity: 'CRITICAL', title: 'Missing og:title', description: 'No Open Graph title meta tag found. Facebook/LinkedIn/WhatsApp will not display a proper title when shared.', impact: 'Links shared on social media will look unprofessional', category: 'Open Graph' });
        score -= 15;
    } else if (ogTitle.length > 95) {
        issues.push({ id: 'og-title-long', severity: 'WARNING', title: 'og:title Too Long', description: `og:title is ${ogTitle.length} characters. Keep it under 95 for best display.`, impact: 'Title may be truncated on Facebook/WhatsApp', category: 'Open Graph' });
        score -= 5;
    }

    if (!ogDesc) {
        issues.push({ id: 'og-no-desc', severity: 'WARNING', title: 'Missing og:description', description: 'No Open Graph description tag. Social platforms will auto-generate one, which may not be ideal.', impact: 'Shared links may show random page text as description', category: 'Open Graph' });
        score -= 10;
    }

    if (!ogImage) {
        issues.push({ id: 'og-no-image', severity: 'CRITICAL', title: 'Missing og:image', description: 'No Open Graph image. Shared links will appear without a preview image, drastically reducing engagement.', impact: 'Links get 40% fewer clicks without preview images', category: 'Open Graph' });
        score -= 20;
    }

    if (!ogUrl) {
        issues.push({ id: 'og-no-url', severity: 'WARNING', title: 'Missing og:url', description: 'No canonical Open Graph URL specified.', impact: 'Social platforms may use wrong URL for the page', category: 'Open Graph' });
        score -= 5;
    }

    if (!ogType) {
        issues.push({ id: 'og-no-type', severity: 'WARNING', title: 'Missing og:type', description: 'No og:type specified (e.g., "website", "article"). Defaults to "website".', impact: 'Minor — platform may not categorize content correctly', category: 'Open Graph' });
        score -= 3;
    }

    // ── 2. Twitter Card Tags ──
    const twCard = $('meta[name="twitter:card"]').attr('content');
    const twTitle = $('meta[name="twitter:title"]').attr('content');
    const twDesc = $('meta[name="twitter:description"]').attr('content');
    const twImage = $('meta[name="twitter:image"]').attr('content');

    if (!twCard) {
        issues.push({ id: 'tw-no-card', severity: 'WARNING', title: 'Missing Twitter Card', description: 'No twitter:card meta tag. Twitter/X will not display a rich preview.', impact: 'Posts with your link will look plain on Twitter/X', category: 'Twitter Card' });
        score -= 10;
    }

    if (!twImage && !ogImage) {
        issues.push({ id: 'tw-no-image', severity: 'WARNING', title: 'No Social Preview Image', description: 'Neither twitter:image nor og:image found. No preview image on any social platform.', impact: 'Significantly reduces click-through rate on social media', category: 'Twitter Card' });
        score -= 10;
    }

    // ── 3. General Social Tags ──
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href');
    if (!favicon) {
        issues.push({ id: 'social-no-favicon', severity: 'WARNING', title: 'No Favicon Found', description: 'No favicon link found. Browsers and social platforms use favicons for branding.', impact: 'Browser tabs and bookmarks will show generic icon', category: 'General' });
        score -= 5;
    }

    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
        issues.push({ id: 'social-no-canonical', severity: 'WARNING', title: 'No Canonical URL', description: 'No canonical link tag found. This can cause duplicate content issues for social sharing.', impact: 'Social platforms may index wrong URL variant', category: 'General' });
        score -= 5;
    }

    return { score: Math.max(0, score), issues, summary: { totalIssues: issues.length, ogTags: { title: !!ogTitle, desc: !!ogDesc, image: !!ogImage }, twitterCard: !!twCard } };
}

module.exports = { analyzeSocialPreview };
