const fs = require('fs').promises;
const ApkReader = require('adbkit-apkreader');

/**
 * Analyze APK file for various metrics
 */
exports.analyze = async (filePath) => {
    try {
        // Get file size
        const stats = await fs.stat(filePath);
        const fileSizeBytes = stats.size;
        const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

        // Read APK
        const reader = await ApkReader.open(filePath);

        // Get manifest data
        const manifest = await reader.readManifest();

        // Extract information
        const packageName = manifest.package;
        const versionName = manifest.versionName;
        const versionCode = manifest.versionCode;
        const minSdkVersion = manifest.usesSDK?.minSdkVersion || 'Unknown';
        const targetSdkVersion = manifest.usesSDK?.targetSdkVersion || 'Unknown';
        const permissions = manifest.usesPermissions || [];

        // Analyze permissions
        const permissionAnalysis = analyzePermissions(permissions);

        // Analyze SDK versions
        const sdkAnalysis = analyzeSdkVersions(minSdkVersion, targetSdkVersion);

        // Analyze APK size
        const sizeAnalysis = analyzeApkSize(fileSizeMB);

        return {
            packageName: packageName || 'com.unknown.app',
            versionName: versionName || '1.0',
            versionCode: versionCode || '1',
            fileSizeMB: parseFloat(fileSizeMB),
            fileSizeBytes,
            minSdkVersion: String(minSdkVersion),
            targetSdkVersion: String(targetSdkVersion),
            permissions: permissions.map(p => typeof p === 'string' ? p : (p.name || 'Unknown')),
            permissionCount: permissions.length,
            analysis: {
                size: sizeAnalysis,
                permissions: permissionAnalysis,
                sdk: sdkAnalysis
            }
        };

    } catch (error) {
        console.error('APK analysis error:', error);
        throw new Error(`Failed to analyze APK: ${error.message}`);
    }
};

function analyzeApkSize(sizeMB) {
    const issues = [];

    if (sizeMB > 100) {
        issues.push({
            severity: 'CRITICAL',
            message: `APK size is ${sizeMB} MB, which is very large (> 100 MB)`,
            impact: 'Users may not download due to storage constraints and slow downloads'
        });
    } else if (sizeMB > 50) {
        issues.push({
            severity: 'WARNING',
            message: `APK size is ${sizeMB} MB, larger than recommended (> 50 MB)`,
            impact: 'May discourage downloads on mobile networks'
        });
    } else if (sizeMB > 20) {
        issues.push({
            severity: 'WARNING',
            message: `APK size is ${sizeMB} MB (recommended < 20 MB)`,
            impact: 'Consider optimization to improve download rates'
        });
    }

    return {
        sizeMB,
        issues
    };
}

function analyzePermissions(permissions) {
    const issues = [];
    const dangerousPermissions = [
        'android.permission.CAMERA',
        'android.permission.RECORD_AUDIO',
        'android.permission.ACCESS_FINE_LOCATION',
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.READ_CONTACTS',
        'android.permission.WRITE_CONTACTS',
        'android.permission.READ_SMS',
        'android.permission.SEND_SMS',
        'android.permission.READ_CALL_LOG',
        'android.permission.WRITE_CALL_LOG',
        'android.permission.READ_PHONE_STATE',
        'android.permission.CALL_PHONE',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE'
    ];

    const permissionNames = permissions.map(p => typeof p === 'string' ? p : p.name);
    const foundDangerous = permissionNames.filter(p => dangerousPermissions.includes(p));

    if (permissionNames.length > 15) {
        issues.push({
            severity: 'WARNING',
            message: `App requests ${permissionNames.length} permissions (recommended < 10)`,
            impact: 'Users may be concerned about privacy'
        });
    }

    if (foundDangerous.length > 5) {
        issues.push({
            severity: 'WARNING',
            message: `App requests ${foundDangerous.length} sensitive permissions`,
            impact: 'May increase user concern and uninstall rates',
            permissions: foundDangerous
        });
    }

    return {
        total: permissionNames.length,
        dangerous: foundDangerous,
        issues
    };
}

function analyzeSdkVersions(minSdk, targetSdk) {
    const issues = [];
    const currentSdk = 34; // Android 14 (as of 2024)
    const minimumRecommended = 21; // Android 5.0

    const minSdkNum = parseInt(minSdk);
    const targetSdkNum = parseInt(targetSdk);

    if (!isNaN(minSdkNum) && minSdkNum < minimumRecommended) {
        issues.push({
            severity: 'CRITICAL',
            message: `minSdkVersion is ${minSdk} (Android ${getAndroidVersion(minSdkNum)})`,
            impact: 'Very old Android versions have security vulnerabilities',
            recommendation: `Update to at least ${minimumRecommended} (Android 5.0)`
        });
    }

    if (!isNaN(targetSdkNum)) {
        const sdkDiff = currentSdk - targetSdkNum;

        if (sdkDiff > 3) {
            issues.push({
                severity: 'CRITICAL',
                message: `targetSdkVersion is ${targetSdk}, current is ${currentSdk}`,
                impact: 'Play Store may restrict app distribution',
                recommendation: `Update to ${currentSdk} (Android 14)`
            });
        } else if (sdkDiff > 1) {
            issues.push({
                severity: 'WARNING',
                message: `targetSdkVersion is ${targetSdk}, slightly outdated`,
                impact: 'Should update soon to avoid Play Store restrictions',
                recommendation: `Update to ${currentSdk}`
            });
        }
    }

    return {
        minSdk: minSdkNum,
        targetSdk: targetSdkNum,
        currentSdk,
        issues
    };
}

function getAndroidVersion(sdkVersion) {
    const versions = {
        16: '4.1', 17: '4.2', 18: '4.3', 19: '4.4',
        21: '5.0', 22: '5.1', 23: '6.0', 24: '7.0',
        25: '7.1', 26: '8.0', 27: '8.1', 28: '9',
        29: '10', 30: '11', 31: '12', 32: '12L',
        33: '13', 34: '14'
    };
    return versions[sdkVersion] || 'Unknown';
}

module.exports = exports;
