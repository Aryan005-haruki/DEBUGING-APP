/**
 * PHASE 3: Schema Validator
 * Validates Schema.org structured data markup
 */

const cheerio = require('cheerio');

/**
 * Validate schema markup on page
 * @param {Object} pageData - Page data with HTML
 * @returns {Object} Analysis results with score and issues
 */
exports.analyze = (pageData) => {
    const issues = [];
    let penalty = 0;

    try {
        const $ = cheerio.load(pageData.html || '');

        // Find JSON-LD scripts
        const jsonLdScripts = $('script[type="application/ld+json"]');

        if (jsonLdScripts.length === 0) {
            issues.push({
                id: 'schema-missing',
                severity: 'WARNING',
                title: 'No Schema Markup Found',
                description: 'Page has no structured data (JSON-LD)',
                impact: 'Missing rich snippets opportunity in search results',
                category: 'SEO - Schema',
                fixSuggestion: {
                    title: 'Add Schema Markup',
                    steps: [
                        'Add JSON-LD structured data to your page',
                        'Use Schema.org types appropriate for your content',
                        'Common types: Organization, Article, Product, FAQ',
                        'Validate with Google Rich Results Test'
                    ]
                }
            });
            penalty = 15;
        } else {
            // Validate each schema
            jsonLdScripts.each((i, script) => {
                try {
                    const schemaData = JSON.parse($(script).html());
                    const validation = validateSchema(schemaData);
                    issues.push(...validation.issues);
                    penalty += validation.penalty;
                } catch (e) {
                    issues.push({
                        id: `schema-invalid-${i}`,
                        severity: 'WARNING',
                        title: 'Invalid JSON-LD',
                        description: 'Schema markup has JSON syntax errors',
                        impact: 'Search engines cannot read this schema',
                        category: 'SEO - Schema'
                    });
                    penalty += 5;
                }
            });
        }

        // Check for microdata (alternative to JSON-LD)
        const microdata = $('[itemscope]');
        if (microdata.length > 0 && jsonLdScripts.length === 0) {
            issues.push({
                id: 'schema-microdata',
                severity: 'WARNING',
                title: 'Using Microdata Instead of JSON-LD',
                description: 'Page uses microdata (consider JSON-LD instead)',
                impact: 'JSON-LD is easier to maintain and recommended by Google',
                category: 'SEO - Schema'
            });
            penalty += 3;
        }

        const score = Math.max(0, 100 - penalty);

        return {
            score,
            issues,
            summary: {
                schemasFound: jsonLdScripts.length,
                types: [] // Could extract @type from each schema
            }
        };

    } catch (error) {
        console.error('Schema validation error:', error.message);
        return {
            score: 0,
            issues: [],
            error: error.message
        };
    }
};

/**
 * Validate individual schema object
 */
function validateSchema(schemaData) {
    const issues = [];
    let penalty = 0;

    // Check for @context
    if (!schemaData['@context']) {
        issues.push({
            id: 'schema-no-context',
            severity: 'WARNING',
            title: 'Schema Missing @context',
            description: 'Schema must include @context property',
            impact: 'Search engines may not recognize the schema',
            category: 'SEO - Schema'
        });
        penalty += 5;
    }

    // Check for @type
    if (!schemaData['@type']) {
        issues.push({
            id: 'schema-no-type',
            severity: 'WARNING',
            title: 'Schema Missing @type',
            description: 'Schema must specify a @type',
            impact: 'Search engines cannot determine schema purpose',
            category: 'SEO - Schema'
        });
        penalty += 5;
    } else {
        // Type-specific validation
        const type = schemaData['@type'];

        if (type === 'Organization') {
            const orgValidation = validateOrganization(schemaData);
            issues.push(...orgValidation.issues);
            penalty += orgValidation.penalty;
        } else if (type === 'Article' || type === 'BlogPosting' || type === 'NewsArticle') {
            const articleValidation = validateArticle(schemaData);
            issues.push(...articleValidation.issues);
            penalty += articleValidation.penalty;
        } else if (type === 'Product') {
            const productValidation = validateProduct(schemaData);
            issues.push(...productValidation.issues);
            penalty += productValidation.penalty;
        }
    }

    return { issues, penalty };
}

/**
 * Validate Organization schema
 */
function validateOrganization(schema) {
    const issues = [];
    let penalty = 0;

    const requiredFields = ['name', 'url'];
    const recommendedFields = ['logo', 'contactPoint', 'sameAs'];

    // Check required fields
    for (const field of requiredFields) {
        if (!schema[field]) {
            issues.push({
                id: `schema-org-missing-${field}`,
                severity: 'WARNING',
                title: `Organization Schema Missing ${field}`,
                description: `${field} is required for Organization schema`,
                impact: 'Incomplete Organization markup',
                category: 'SEO - Schema'
            });
            penalty += 3;
        }
    }

    // Check recommended fields
    for (const field of recommendedFields) {
        if (!schema[field]) {
            issues.push({
                id: `schema-org-recommended-${field}`,
                severity: 'INFO',
                title: `Organization Schema Missing ${field}`,
                description: `${field} is recommended for better rich results`,
                impact: 'Missing optional but valuable data',
                category: 'SEO - Schema'
            });
        }
    }

    return { issues, penalty };
}

/**
 * Validate Article schema
 */
function validateArticle(schema) {
    const issues = [];
    let penalty = 0;

    const requiredFields = ['headline', 'author', 'datePublished'];

    for (const field of requiredFields) {
        if (!schema[field]) {
            issues.push({
                id: `schema-article-missing-${field}`,
                severity: 'WARNING',
                title: `Article Schema Missing ${field}`,
                description: `${field} is required for Article schema`,
                impact: 'May not qualify for Article rich results',
                category: 'SEO - Schema'
            });
            penalty += 3;
        }
    }

    // Check for image (recommended)
    if (!schema.image) {
        issues.push({
            id: 'schema-article-no-image',
            severity: 'INFO',
            title: 'Article Schema Missing Image',
            description: 'Adding an image improves rich results',
            impact: 'Articles with images perform better in search',
            category: 'SEO - Schema'
        });
    }

    return { issues, penalty };
}

/**
 * Validate Product schema
 */
function validateProduct(schema) {
    const issues = [];
    let penalty = 0;

    const requiredFields = ['name', 'image'];

    for (const field of requiredFields) {
        if (!schema[field]) {
            issues.push({
                id: `schema-product-missing-${field}`,
                severity: 'WARNING',
                title: `Product Schema Missing ${field}`,
                description: `${field} is required for Product schema`,
                impact: 'May not show product rich results',
                category: 'SEO - Schema'
            });
            penalty += 3;
        }
    }

    // Check for offers
    if (!schema.offers) {
        issues.push({
            id: 'schema-product-no-offers',
            severity: 'WARNING',
            title: 'Product Schema Missing Offers',
            description: 'Product schema should include price/availability',
            impact: 'No price shown in search results',
            category: 'SEO - Schema'
        });
        penalty += 3;
    }

    return { issues, penalty };
}

module.exports = exports;
