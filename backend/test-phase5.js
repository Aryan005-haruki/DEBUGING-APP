#!/usr/bin/env node

/**
 * Test Script for Phase 5 Code Quality Integration
 * This script tests if Phase 5 is properly integrated and working
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1/analyze/website';
const TEST_URL = 'https://example.com';

async function testPhase5Integration() {
    console.log('🧪 Testing Phase 5 Code Quality Integration...\n');
    console.log(`📊 Analyzing: ${TEST_URL}\n`);

    try {
        const response = await axios.post(API_URL, {
            url: TEST_URL
        }, {
            timeout: 60000 // 60 seconds
        });

        if (response.data.status === 'success') {
            const report = response.data.data;

            console.log('✅ Analysis successful!\n');
            console.log(`📈 Summary:`);
            console.log(`   Critical: ${report.summary.critical}`);
            console.log(`   Warnings: ${report.summary.warning}`);
            console.log(`   Passed: ${report.summary.passed}\n`);

            // Find Code Quality category
            const codeQualityCategory = report.categories.find(
                cat => cat.name === 'Code Quality'
            );

            if (codeQualityCategory) {
                console.log('🎉 Phase 5 Code Quality: FOUND ✅\n');
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
                console.log(`   Category: ${codeQualityCategory.name}`);
                console.log(`   Score: ${codeQualityCategory.score || 'N/A'}/100`);

                if (codeQualityCategory.summary) {
                    console.log(`   Grade: ${codeQualityCategory.summary.grade || 'N/A'}`);
                    console.log(`   Total Issues: ${codeQualityCategory.summary.totalIssues || 0}`);
                    console.log(`   Critical: ${codeQualityCategory.summary.critical || 0}`);
                    console.log(`   Warnings: ${codeQualityCategory.summary.warning || 0}`);

                    if (codeQualityCategory.summary.categories) {
                        console.log(`\n   📊 Breakdown:`);
                        const cats = codeQualityCategory.summary.categories;
                        if (cats.html !== undefined) console.log(`      HTML: ${cats.html}/100`);
                        if (cats.css !== undefined) console.log(`      CSS: ${cats.css}/100`);
                        if (cats.javascript !== undefined) console.log(`      JavaScript: ${cats.javascript}/100`);
                        if (cats.performance !== undefined) console.log(`      Performance: ${cats.performance}/100`);
                        if (cats.compatibility !== undefined) console.log(`      Compatibility: ${cats.compatibility}/100`);
                    }
                }
                console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

                console.log('✅ PHASE 5 INTEGRATION: SUCCESS!\n');
            } else {
                console.log('❌ Phase 5 Code Quality: NOT FOUND\n');
                console.log('Available categories:');
                report.categories.forEach(cat => {
                    console.log(`   - ${cat.name}`);
                });
                console.log('\n❌ PHASE 5 INTEGRATION: FAILED\n');
            }

            console.log(`\n📋 All Categories (${report.categories.length} total):`);
            report.categories.forEach((cat, idx) => {
                const score = cat.score !== null ? `${cat.score}/100` : 'N/A';
                const issues = cat.issues ? cat.issues.length : 0;
                console.log(`   ${idx + 1}. ${cat.name} - Score: ${score}, Issues: ${issues}`);
            });

        } else {
            console.log('❌ Analysis failed:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Response:', error.response.data);
        }
    }
}

// Run the test
testPhase5Integration();
