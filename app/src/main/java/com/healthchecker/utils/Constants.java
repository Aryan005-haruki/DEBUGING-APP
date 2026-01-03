package com.healthchecker.utils;

public class Constants {
    // ============================================================
    // API CONFIGURATION - CHOOSE ONE BASED ON YOUR SETUP
    // ============================================================

    // OPTION 1: For Android Emulator (localhost backend)
    public static final String BASE_URL = "http://10.0.2.2:3000/api/v1/";

    // OPTION 2: For Physical Device on same WiFi
    // Replace with your PC's local IP (run 'ipconfig' in terminal)
    // public static final String BASE_URL = "http://192.168.0.103:3000/api/v1/";

    // OPTION 3: For deployed backend (Railway, Render, etc.)
    // public static final String BASE_URL = "https://your-app.railway.app/api/v1/";

    // OPTION 4: For testing with ngrok (temporary public URL)
    // Install ngrok: https://ngrok.com/download
    // Run: ngrok http 3000
    // Copy the https URL here
    // public static final String BASE_URL =
    // "https://xxxx-xxx-xxx.ngrok-free.app/api/v1/";

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
