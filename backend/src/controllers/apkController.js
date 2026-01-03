const fs = require('fs').promises;
const apkAnalysisService = require('../services/apkAnalysisService');
const reportGenerator = require('../services/reportGeneratorService');

exports.analyzeApk = async (req, res) => {
    let filePath = null;

    try {
        if (!req.file) {
            return res.status(400).json({
                status: 'error',
                message: 'APK file is required'
            });
        }

        filePath = req.file.path;
        console.log(`📱 Analyzing APK: ${req.file.originalname}`);

        // Analyze APK
        const analysisResults = await apkAnalysisService.analyze(filePath);

        // Generate report
        const report = reportGenerator.generateApkReport(analysisResults);

        console.log(`✅ APK analysis complete: ${req.file.originalname}`);

        // Clean up uploaded file
        await fs.unlink(filePath);

        res.json({
            status: 'success',
            data: report
        });

    } catch (error) {
        console.error('APK analysis error:', error);

        // Clean up file on error
        if (filePath) {
            try {
                await fs.unlink(filePath);
            } catch (unlinkError) {
                console.error('Failed to delete file:', unlinkError);
            }
        }

        res.status(500).json({
            status: 'error',
            message: 'Failed to analyze APK',
            details: error.message
        });
    }
};
