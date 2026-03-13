package com.healthchecker.utils;

public class Constants {
    // ============================================================
    // API CONFIGURATION
    // ============================================================

    // PRODUCTION — Vercel Deployed Backend
    // After deploying to Vercel, replace the URL below with your Vercel URL:
    public static final String BASE_URL = "https://backend-rouge-two-23.vercel.app/api/v1/";

    // LOCAL DEVELOPMENT (Android Emulator)
    // public static final String BASE_URL = "http://10.0.2.2:3000/api/v1/";

    // LOCAL DEVELOPMENT (Physical Device — use your PC's WiFi IP)
    // public static final String BASE_URL = "http://192.168.x.x:3000/api/v1/";

    // RAILWAY Deployment (alternative)
    // public static final String BASE_URL = "https://YOUR-APP.up.railway.app/api/v1/";

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
