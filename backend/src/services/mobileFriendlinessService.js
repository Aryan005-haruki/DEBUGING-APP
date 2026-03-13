const cheerio = require('cheerio');

/**
 * Mobile-Friendliness Deep Check Service
 * Viewport, touch targets, font sizes, horizontal scroll, tap delay
 */

/**
 * Check mobile-friendliness of a page
 */
exports.checkMobileFriendliness = (url, pageData) => {
    console.log(`📱 Checking mobile-friendliness for: ${url}`);

    const html = pageData.html || '';
    const $ = cheerio.load(html);
    const issues = [];

    // ── 1. Viewport Meta Tag ──
    const viewportTag = $('meta[name="viewport"]').attr('content') || '';
    if (!viewportTag) {
        issues.push({
            id: 'mobile-001',
            severity: 'CRITICAL',
            title: 'Missing Viewport Meta Tag',
            description: 'No <meta name="viewport"> tag found in <head>',
            impact: 'Page will render at desktop width on mobile devices — unreadable and unzoomable',
            category: 'Mobile Friendliness'
        });
    } else {
        if (!viewportTag.includes('width=device-width')) {
            issues.push({
                id: 'mobile-002',
                severity: 'WARNING',
                title: 'Viewport Missing width=device-width',
                description: `Viewport is set to "${viewportTag}" but lacks width=device-width`,
                impact: 'Page may not scale properly on different screen sizes',
                category: 'Mobile Friendliness'
            });
        }
        if (viewportTag.includes('user-scalable=no') || viewportTag.includes('maximum-scale=1')) {
            issues.push({
                id: 'mobile-003',
                severity: 'WARNING',
                title: 'Zoom Disabled',
                description: 'Viewport disables user zooming (user-scalable=no or maximum-scale=1)',
                impact: 'Users with visual impairments cannot zoom in to read content',
                category: 'Mobile Friendliness'
            });
        }
    }

    // ── 2. Touch Target Sizes ──
    let smallButtons = 0;
    $('a, button, input[type="submit"], input[type="button"], [role="button"]').each((i, el) => {
        const style = $(el).attr('style') || '';
        // Check for inline styles with very small dimensions
        const widthMatch = style.match(/width\s*:\s*(\d+)/);
        const heightMatch = style.match(/height\s*:\s*(\d+)/);
        if (widthMatch && parseInt(widthMatch[1]) < 44) smallButtons++;
        if (heightMatch && parseInt(heightMatch[1]) < 44) smallButtons++;

        // Check for tiny font-size on clickables
        const fontMatch = style.match(/font-size\s*:\s*(\d+)/);
        if (fontMatch && parseInt(fontMatch[1]) < 12) smallButtons++;
    });

    // Check overall clickable count
    const totalClickables = $('a, button, [role="button"], input[type="submit"]').length;

    if (smallButtons > 3) {
        issues.push({
            id: 'mobile-004',
            severity: 'WARNING',
            title: 'Small Touch Targets Detected',
            description: `Found ${smallButtons} interactive elements that may be too small for touch (< 44x44px)`,
            impact: 'Mobile users will have difficulty tapping buttons and links accurately',
            category: 'Mobile Friendliness'
        });
    }

    // ── 3. Font Size Check ──
    let tinyFontCount = 0;
    $('*').each((i, el) => {
        const style = $(el).attr('style') || '';
        const fontMatch = style.match(/font-size\s*:\s*(\d+)\s*px/);
        if (fontMatch && parseInt(fontMatch[1]) < 12) {
            tinyFontCount++;
        }
    });

    if (tinyFontCount > 5) {
        issues.push({
            id: 'mobile-005',
            severity: 'WARNING',
            title: 'Small Font Sizes',
            description: `${tinyFontCount} elements use font-size smaller than 12px`,
            impact: 'Text is hard to read on mobile without zooming',
            category: 'Mobile Friendliness'
        });
    }

    // ── 4. Horizontal overflow ──
    let fixedWidthCount = 0;
    $('*').each((i, el) => {
        const style = $(el).attr('style') || '';
        const widthMatch = style.match(/width\s*:\s*(\d+)\s*px/);
        if (widthMatch && parseInt(widthMatch[1]) > 500) {
            fixedWidthCount++;
        }
    });

    if (fixedWidthCount > 0) {
        issues.push({
            id: 'mobile-006',
            severity: 'WARNING',
            title: 'Fixed-Width Elements Found',
            description: `${fixedWidthCount} elements have fixed width > 500px`,
            impact: 'Content may overflow horizontally on mobile, causing horizontal scrolling',
            category: 'Mobile Friendliness'
        });
    }

    // ── 5. Responsive images ──
    let nonResponsiveImages = 0;
    $('img').each((i, el) => {
        const style = $(el).attr('style') || '';
        const width = $(el).attr('width');
        if (width && parseInt(width) > 400 && !style.includes('max-width')) {
            nonResponsiveImages++;
        }
    });

    if (nonResponsiveImages > 3) {
        issues.push({
            id: 'mobile-007',
            severity: 'WARNING',
            title: 'Non-Responsive Images',
            description: `${nonResponsiveImages} images have fixed width > 400px without max-width`,
            impact: 'Images may overflow on small screens',
            category: 'Mobile Friendliness'
        });
    }

    // ── 6. MediaQuery / Responsive CSS check ──
    const hasMediaQuery = html.includes('@media') || html.includes('media=');
    const hasResponsiveFramework = html.includes('bootstrap') || html.includes('tailwind') || html.includes('foundation');

    if (!hasMediaQuery && !hasResponsiveFramework) {
        issues.push({
            id: 'mobile-008',
            severity: 'WARNING',
            title: 'No Responsive CSS Detected',
            description: 'No @media queries or responsive CSS framework found',
            impact: 'Page layout may not adapt to different screen sizes',
            category: 'Mobile Friendliness'
        });
    }

    // Score
    let score = 100;
    score -= issues.filter(i => i.severity === 'CRITICAL').length * 25;
    score -= issues.filter(i => i.severity === 'WARNING').length * 8;
    score = Math.max(0, Math.min(100, score));

    console.log(`✅ Mobile check complete: score ${score}/100`);

    return {
        url,
        checkedAt: new Date().toISOString(),
        viewport: viewportTag || 'NOT SET',
        totalClickables,
        hasResponsiveCSS: hasMediaQuery || hasResponsiveFramework,
        issues,
        score
    };
};

module.exports = exports;
