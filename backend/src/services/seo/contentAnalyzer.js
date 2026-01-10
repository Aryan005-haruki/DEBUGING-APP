/**
 * PHASE 3: Content Analyzer
 * Analyzes content quality, readability, and keyword optimization
 */

const cheerio = require('cheerio');

/**
 * Analyze page content quality
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let score = 100;

    try {
        const $ = cheerio.load(pageData.html || '');

        // Extract text content (remove scripts, styles, etc.)
        $('script, style, noscript').remove();
        const bodyText = $('body').text().trim();
        const cleanText = bodyText.replace(/\s+/g, ' ');

        // 1. Word Count Analysis
        const wordCountAnalysis = analyzeWordCount(cleanText);
        issues.push(...wordCountAnalysis.issues);
        score -= wordCountAnalysis.penalty;

        // 2. Readability Analysis
        const readabilityAnalysis = analyzeReadability(cleanText);
        issues.push(...readabilityAnalysis.issues);
        score -= readabilityAnalysis.penalty;

        // 3. Paragraph Analysis
        const paragraphAnalysis = analyzeParagraphs($);
        issues.push(...paragraphAnalysis.issues);
        score -= paragraphAnalysis.penalty;

        // 4. Keyword Density (basic)
        const keywordAnalysis = analyzeKeywordDensity(cleanText);
        issues.push(...keywordAnalysis.issues);
        score -= keywordAnalysis.penalty;

        return {
            score: Math.max(0, score),
            issues,
            summary: {
                wordCount: countWords(cleanText),
                readabilityGrade: calculateReadabilityGrade(cleanText),
                paragraphs: $('p').length
            }
        };

    } catch (error) {
        console.error('Content analysis error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

/**
 * Count words in text
 */
function countWords(text) {
    return text.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Analyze word count
 */
function analyzeWordCount(text) {
    const issues = [];
    let penalty = 0;

    const wordCount = countWords(text);

    if (wordCount < 300) {
        issues.push({
            id: 'content-thin',
            severity: 'CRITICAL',
            title: 'Thin Content',
            description: `Page has only ${wordCount} words (recommended: 300+)`,
            impact: 'Thin content may rank poorly in search results',
            category: 'SEO - Content',
            fixSuggestion: {
                title: 'Add More Content',
                steps: [
                    'Aim for at least 300-500 words minimum',
                    'Add valuable information for users',
                    'Include relevant keywords naturally',
                    'Expand on main topics'
                ]
            }
        });
        penalty = 20;
    } else if (wordCount < 500) {
        issues.push({
            id: 'content-short',
            severity: 'WARNING',
            title: 'Short Content',
            description: `Page has ${wordCount} words (recommended: 500+ for better SEO)`,
            impact: 'More content may improve rankings',
            category: 'SEO - Content'
        });
        penalty = 10;
    }

    return { issues, penalty };
}

/**
 * Analyze readability (simplified Flesch-Kincaid)
 */
function analyzeReadability(text) {
    const issues = [];
    let penalty = 0;

    const grade = calculateReadabilityGrade(text);

    if (grade > 12) {
        issues.push({
            id: 'content-difficult',
            severity: 'WARNING',
            title: 'Content Too Difficult',
            description: `Reading level: Grade ${grade} (recommended: 8-10)`,
            impact: 'May be hard for general audience to understand',
            category: 'SEO - Content',
            fixSuggestion: {
                title: 'Simplify Content',
                steps: [
                    'Use shorter sentences',
                    'Use simpler words',
                    'Break up long paragraphs',
                    'Aim for 8th-10th grade reading level'
                ]
            }
        });
        penalty = 5;
    }

    return { issues, penalty };
}

/**
 * Calculate readability grade (simplified approximation)
 */
function calculateReadabilityGrade(text) {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length === 0 || words.length === 0) return 0;

    const avgWordsPerSentence = words.length / sentences.length;
    const avgSyllablesPerWord = estimateAverageSyllables(words);

    // Simplified Flesch-Kincaid formula
    const grade = (0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59;
    return Math.max(0, Math.round(grade));
}

/**
 * Estimate average syllables per word (rough approximation)
 */
function estimateAverageSyllables(words) {
    let totalSyllables = 0;

    for (const word of words) {
        totalSyllables += estimateSyllables(word);
    }

    return words.length > 0 ? totalSyllables / words.length : 0;
}

/**
 * Estimate syllables in a word
 */
function estimateSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;

    const vowels = word.match(/[aeiouy]/g);
    return vowels ? Math.max(1, vowels.length - (word.endsWith('e') ? 1 : 0)) : 1;
}

/**
 * Analyze paragraphs
 */
function analyzeParagraphs($) {
    const issues = [];
    let penalty = 0;

    const paragraphs = $('p');
    if (paragraphs.length === 0) {
        issues.push({
            id: 'content-no-paragraphs',
            severity: 'WARNING',
            title: 'No Paragraph Tags',
            description: 'No <p> tags found on page',
            impact: 'Content structure may be poor',
            category: 'SEO - Content'
        });
        penalty = 5;
    }

    // Check for very long paragraphs
    let longParagraphs = 0;
    paragraphs.each((i, elem) => {
        const text = $(elem).text();
        const sentences = text.split(/[.!?]+/).length;
        if (sentences > 5) {
            longParagraphs++;
        }
    });

    if (longParagraphs > 3) {
        issues.push({
            id: 'content-long-paragraphs',
            severity: 'WARNING',
            title: 'Long Paragraphs',
            description: `${longParagraphs} paragraphs have 5+ sentences`,
            impact: 'May reduce readability',
            category: 'SEO - Content',
            fixSuggestion: {
                title: 'Break Up Paragraphs',
                steps: [
                    'Keep paragraphs to 3-4 sentences',
                    'Use bullet points for lists',
                    'Add subheadings for better structure'
                ]
            }
        });
        penalty = 3;
    }

    return { issues, penalty };
}

/**
 * Analyze keyword density (basic check for keyword stuffing)
 */
function analyzeKeywordDensity(text) {
    const issues = [];
    let penalty = 0;

    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const wordFrequency = {};

    // Count word frequency
    for (const word of words) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }

    // Check if any word appears too frequently (> 5%)
    for (const [word, count] of Object.entries(wordFrequency)) {
        const density = (count / words.length) * 100;
        if (density > 5 && word.length > 4) {
            issues.push({
                id: `content-keyword-stuffing-${word}`,
                severity: 'WARNING',
                title: 'Possible Keyword Stuffing',
                description: `Word "${word}" appears ${count} times (${density.toFixed(1)}%)`,
                impact: 'Keyword stuffing can harm SEO',
                category: 'SEO - Content',
                fixSuggestion: {
                    title: 'Reduce Keyword Density',
                    steps: [
                        'Use synonyms and variations',
                        'Aim for 2-3% keyword density',
                        'Write naturally for users, not search engines'
                    ]
                }
            });
            penalty += 3;
            break; // Only report first instance
        }
    }

    return { issues, penalty };
}

module.exports = exports;
