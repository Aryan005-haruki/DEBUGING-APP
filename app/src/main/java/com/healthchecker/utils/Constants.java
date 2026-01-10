package com.healthchecker.utils;

public class Constants {
    // ============================================================
    // API CONFIGURATION - RAILWAY DEPLOYED VERSION
    // ============================================================

    // DEPLOYED BACKEND (Railway) - Works from anywhere! 🌍
    // TODO: Replace with your actual Railway URL after deployment
    public static final String BASE_URL = "https://YOUR-APP-NAME.up.railway.app/api/v1/";

    // INSTRUCTIONS:
    // 1. Deploy backend to Railway (follow RAILWAY_DEPLOYMENT_GUIDE.md)
    // 2. Get your Railway public URL from Railway dashboard
    // 3. Replace "YOUR-APP-NAME.up.railway.app" with your actual URL
    // 4. Make sure "/api/v1/" is at the end
    // 5. Save this file
    // 6. Rebuild app in Android Studio (Build → Rebuild Project)

    // EXAMPLE:
    // public static final String BASE_URL =
    // "https://health-checker-backend-production.up.railway.app/api/v1/";

    // ============================================================
    // BACKUP OPTIONS (Uncomment if needed)
    // ============================================================

    // For Android Emulator (localhost backend)
    // public static final String BASE_URL = "http://10.0.2.2:3000/api/v1/";

    // For Physical Device on same WiFi (your PC's IP)
    // public static final String BASE_URL = "http://192.168.0.103:3000/api/v1/";

    // For Render deployment
    // public static final String BASE_URL =
    // "https://health-checker-api.onrender.com/api/v1/";

    // ============================================================

    // Request timeout
    public static final int TIMEOUT_SECONDS = 120;

    // Intent extras
    public static final String EXTRA_ANALYSIS_TYPE = "analysis_type";
    public static final String EXTRA_URL = "url";
    public static final String EXTRA_REPORT_DATA = "report_data";
    public static final String EXTRA_ISSUE_DATA = "issue_data";

    // Analysis types
    public static final String TYPE_WEBSITE = "website";
    public static final String TYPE_APK = "apk";

    // Shared preferences
    public static final String PREFS_NAME = "HealthCheckerPrefs";
    public static final String PREF_DISCLAIMER_ACCEPTED = "disclaimer_accepted";

    // File picker
    public static final int REQUEST_CODE_PICK_APK = 1001;
    public static final int MAX_APK_SIZE_MB = 50;
}
