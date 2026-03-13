package com.healthchecker.ui.report;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.google.gson.Gson;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.models.Issue;
import com.healthchecker.ui.fixsuggestion.FixSuggestionActivity;
import com.healthchecker.ui.report.adapters.CategoryAdapter;
import com.healthchecker.ui.report.adapters.IssueAdapter;
import com.healthchecker.utils.Constants;
import com.healthchecker.utils.SecurityWarningHelper;
import com.google.android.material.button.MaterialButton;
import android.graphics.Color;
import android.content.Context;
import android.widget.ImageView;
import com.bumptech.glide.Glide;
import java.util.List;

public class ReportActivity extends AppCompatActivity implements IssueAdapter.OnIssueClickListener {
    private ReportViewModel viewModel;
    private TextView tvTitle, tvAnalyzedTime, tvCriticalCount, tvWarningCount, tvPassedCount;
    private RecyclerView recyclerViewCategories;
    private CategoryAdapter categoryAdapter;
    private BottomNavigationView bottomNav;
    private View securityWarningBanner;
    private SecurityWarningHelper securityHelper;
    
    // Hero Score Card views
    private com.mikhaellopez.circularprogressbar.CircularProgressBar circularProgressHero;
    private TextView tvHeroScore, tvGrade, tvIssuesSummary;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_report);

        viewModel = new ViewModelProvider(this).get(ReportViewModel.class);
        securityHelper = new SecurityWarningHelper(this);

        initViews();
        loadReportData();
        setupObservers();

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Analysis Report");
        }
    }

    private void initViews() {
        tvTitle = findViewById(R.id.tvTitle);
        tvAnalyzedTime = findViewById(R.id.tvAnalyzedTime);
        tvCriticalCount = findViewById(R.id.tvCriticalCount);
        tvWarningCount = findViewById(R.id.tvWarningCount);
        tvPassedCount = findViewById(R.id.tvPassedCount);
        recyclerViewCategories = findViewById(R.id.recyclerViewCategories);

        // Security banner is optional (may not be in new layout)
        securityWarningBanner = findViewById(R.id.securityWarningBanner);

        // Setup RecyclerViews
        recyclerViewCategories.setLayoutManager(new LinearLayoutManager(this));

        // Hero Score Card
        circularProgressHero = findViewById(R.id.circularProgressHero);
        tvHeroScore = findViewById(R.id.tvHeroScore);
        tvGrade = findViewById(R.id.tvGrade);
        TextView tvScoreTrend = findViewById(R.id.tvScoreTrend);
        tvIssuesSummary = findViewById(R.id.tvIssuesSummary);

        // Observer for previous report data comparison
        viewModel.getPreviousReportData().observe(this, prevData -> {
            if (prevData != null && tvScoreTrend != null) {
                int currentScore = Integer.parseInt(tvHeroScore.getText().toString());
                int prevScore = calculateOverallScore(prevData);
                int diff = currentScore - prevScore;

                if (diff != 0) {
                    tvScoreTrend.setVisibility(View.VISIBLE);
                    String trendText = (diff > 0 ? "+" : "") + diff + "% " + 
                        (diff > 0 ? "Improved" : "Decreased") + " since last scan";
                    tvScoreTrend.setText(trendText);
                    tvScoreTrend.setTextColor(diff > 0 ? 
                        Color.parseColor("#388E3C") : Color.parseColor("#D32F2F"));
                }
            }
        });

        // Action Buttons
        com.google.android.material.button.MaterialButton btnExportPdf = findViewById(R.id.btnExportPdf);
        com.google.android.material.button.MaterialButton btnShareReport = findViewById(R.id.btnShareReport);

        if (btnExportPdf != null) {
            btnExportPdf.setOnClickListener(v -> exportToPdf());
        }
        if (btnShareReport != null) {
            btnShareReport.setOnClickListener(v -> shareReport());
        }

        // Bottom Navigation
        bottomNav = findViewById(R.id.bottomNav);
        setupBottomNavigation();
    }

    private void shareReport() {
        String url = tvTitle.getText().toString();
        String score = tvHeroScore.getText().toString();
        String grade = tvGrade.getText().toString();
        String issues = tvIssuesSummary.getText().toString();

        String shareText = "🚀 Website Health Report for: " + url + "\n\n" +
                "📊 Overall Score: " + score + "/100\n" +
                "🏆 Grade: " + grade + "\n" +
                "📋 Summary: " + issues + "\n\n" +
                "Scan your website today with HealthChecker! 🔥";

        Intent intent = new Intent(Intent.ACTION_SEND);
        intent.setType("text/plain");
        intent.putExtra(Intent.EXTRA_SUBJECT, "Website Analysis Report");
        intent.putExtra(Intent.EXTRA_TEXT, shareText);
        startActivity(Intent.createChooser(intent, "Share Report via"));
    }

    private void exportToPdf() {
        try {
            android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(Context.PRINT_SERVICE);
            String jobName = getString(R.string.app_name) + " Report - " + tvTitle.getText().toString();

            // Using standard Print API to allow "Save as PDF"
            // This is the cleanest way without heavy external libraries
            android.webkit.WebView webView = new android.webkit.WebView(this);
            webView.setWebViewClient(new android.webkit.WebViewClient() {
                @Override
                public void onPageFinished(android.webkit.WebView view, String url) {
                    android.print.PrintDocumentAdapter printAdapter = webView.createPrintDocumentAdapter(jobName);
                    printManager.print(jobName, printAdapter, new android.print.PrintAttributes.Builder().build());
                }
            });

            // Generate a simple HTML for the report
            StringBuilder html = new StringBuilder();
            html.append("<html><body style='padding:40px; font-family: sans-serif;'>");
            html.append("<h1 style='color: #4F46E5;'>Website Health Report</h1>");
            html.append("<hr>");
            html.append("<p><b>URL:</b> ").append(tvTitle.getText()).append("</p>");
            html.append("<p><b>Date:</b> ").append(tvAnalyzedTime.getText()).append("</p>");
            html.append("<div style='background: #F3F4F6; padding: 20px; border-radius: 10px; margin: 20px 0;'>");
            html.append("<h2>Overall Score: ").append(tvHeroScore.getText()).append("/100</h2>");
            html.append("<h3>Grade: ").append(tvGrade.getText()).append("</h3>");
            html.append("<p>").append(tvIssuesSummary.getText()).append("</p>");
            html.append("</div>");
            html.append("<h3>Issues Breakdown:</h3>");
            html.append("<ul>");
            html.append("<li>🔴 Critical: ").append(tvCriticalCount.getText()).append("</li>");
            html.append("<li>🟠 Warning: ").append(tvWarningCount.getText()).append("</li>");
            html.append("<li>✅ Passed: ").append(tvPassedCount.getText()).append("</li>");
            html.append("</ul>");
            html.append("<p style='margin-top: 50px; font-size: 12px; color: #6B7280;'>Generated by HealthChecker App</p>");
            html.append("</body></html>");

            webView.loadDataWithBaseURL(null, html.toString(), "text/html", "utf-8", null);
        } catch (Exception e) {
            android.widget.Toast.makeText(this, "Failed to export PDF: " + e.getMessage(), android.widget.Toast.LENGTH_SHORT).show();
        }
    }

    private void setupBottomNavigation() {
        bottomNav.setSelectedItemId(R.id.nav_reports);
        bottomNav.setOnItemSelectedListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.nav_reports) {
                return true;
            }
            
            // For other items, go back to MainActivity with the selected tab
            Intent intent = new Intent(this, com.healthchecker.MainActivity.class);
            intent.putExtra("target_fragment", itemId);
            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            startActivity(intent);
            finish();
            return true;
        });
    }

    private void loadReportData() {
        String reportJson = getIntent().getStringExtra(Constants.EXTRA_REPORT_DATA);
        String analysisType = getIntent().getStringExtra(Constants.EXTRA_ANALYSIS_TYPE);

        if (reportJson != null) {
            Gson gson = new Gson();
            AnalysisResponse.ReportData reportData = gson.fromJson(reportJson, AnalysisResponse.ReportData.class);
            viewModel.setReportData(reportData);

            // Set title based on type
            if (Constants.TYPE_WEBSITE.equals(analysisType)) {
                tvTitle.setText(reportData.getUrl());
            } else if (Constants.TYPE_APK.equals(analysisType)) {
                tvTitle.setText(reportData.getPackageName());
            }

            // Set time
            tvAnalyzedTime.setText("Analyzed: " + reportData.getAnalyzedAt());

            // Set summary
            AnalysisResponse.Summary summary = reportData.getSummary();
            if (summary != null) {
                tvCriticalCount.setText(String.valueOf(summary.getCritical()));
                tvWarningCount.setText(String.valueOf(summary.getWarning()));
                tvPassedCount.setText(String.valueOf(summary.getPassed()));
            } else {
                tvCriticalCount.setText("0");
                tvWarningCount.setText("0");
                tvPassedCount.setText("0");
            }

        // Setup category adapter
        if (reportData.getCategories() != null) {
            categoryAdapter = new CategoryAdapter(reportData.getCategories(), category -> {
                CategoryIssuesSheet sheet = CategoryIssuesSheet.newInstance(category);
                sheet.show(getSupportFragmentManager(), "category_issues");
            });
            recyclerViewCategories.setAdapter(categoryAdapter);
            
            // Website Screenshot (New)
            View cardScreenshot = findViewById(R.id.cardScreenshot);
            ImageView ivScreenshot = findViewById(R.id.ivWebsiteScreenshot);
            if (Constants.TYPE_WEBSITE.equals(analysisType) && cardScreenshot != null && ivScreenshot != null) {
                cardScreenshot.setVisibility(View.VISIBLE);
                String screenshotUrl = "https://image.thum.io/get/width/1200/crop/800/" + reportData.getUrl();
                Glide.with(this)
                        .load(screenshotUrl)
                        .listener(new com.bumptech.glide.request.RequestListener<android.graphics.drawable.Drawable>() {
                            @Override
                            public boolean onLoadFailed(com.bumptech.glide.load.engine.GlideException e, Object model, com.bumptech.glide.request.target.Target<android.graphics.drawable.Drawable> target, boolean isFirstResource) {
                                // If the API fails or blocks us, hide the giant empty card
                                cardScreenshot.setVisibility(View.GONE);
                                return false;
                            }

                            @Override
                            public boolean onResourceReady(android.graphics.drawable.Drawable resource, Object model, com.bumptech.glide.request.target.Target<android.graphics.drawable.Drawable> target, com.bumptech.glide.load.DataSource dataSource, boolean isFirstResource) {
                                return false;
                            }
                        })
                        .into(ivScreenshot);
            }

            // Display security warning if applicable (Phase 2)
                displaySecurityWarning(reportData);
                
                // Update Hero Score Card
                int overallScore = calculateOverallScore(reportData);
                tvHeroScore.setText(String.valueOf(overallScore));
                circularProgressHero.setProgress(overallScore);
                
                // Set grade and color
                String grade = SecurityWarningHelper.getGrade(overallScore);
                tvGrade.setText(grade);
                
                int gradeColor;
                if (overallScore >= 90) gradeColor = Color.parseColor("#388E3C");
                else if (overallScore >= 80) gradeColor = Color.parseColor("#8BC34A");
                else if (overallScore >= 70) gradeColor = Color.parseColor("#F57C00");
                else gradeColor = Color.parseColor("#D32F2F");
                
                tvGrade.getBackground().setColorFilter(gradeColor, android.graphics.PorterDuff.Mode.SRC_IN);
                circularProgressHero.setProgressBarColor(gradeColor);
                
                int totalIssues = (summary != null) ? summary.getCritical() + summary.getWarning() : 0;
                tvIssuesSummary.setText(totalIssues + " issues found in " + reportData.getCategories().size() + " categories");

                // Initial load removed - navigation only
            }
        }
    }

    private int calculateOverallScore(AnalysisResponse.ReportData data) {
        if (data.getCategories() == null || data.getCategories().isEmpty()) return 0;
        
        int totalScore = 0;
        int count = 0;
        for (AnalysisResponse.Category category : data.getCategories()) {
            if (category.getScore() != null) {
                totalScore += category.getScore();
                count++;
            }
        }
        return count > 0 ? (int) Math.round((double) totalScore / count) : 0;
    }

    /**
     * PHASE 2: Display security warning banner based on security score
     */
    private void displaySecurityWarning(AnalysisResponse.ReportData reportData) {
        if (securityWarningBanner == null || reportData.getCategories() == null) {
            return;
        }

        // Find Security Vulnerabilities category
        for (AnalysisResponse.Category category : reportData.getCategories()) {
            if ("Security Vulnerabilities".equals(category.getName())) {
                // Get security score and calculate grade
                Integer score = category.getScore();

                if (score != null) {
                    String grade = SecurityWarningHelper.getGrade(score);

                    // Count critical and warning issues
                    int criticalCount = 0;
                    int warningCount = 0;

                    if (category.getIssues() != null) {
                        for (Issue issue : category.getIssues()) {
                            if (issue.isCritical()) {
                                criticalCount++;
                            } else if (issue.isWarning()) {
                                warningCount++;
                            }
                        }
                    }

                    // Display warning using helper
                    securityHelper.displaySecurityWarning(
                            securityWarningBanner,
                            score,
                            grade,
                            criticalCount,
                            warningCount);

                    // Setup button click listener
                    MaterialButton btnViewDetails = securityWarningBanner.findViewById(R.id.btnViewSecurityDetails);
                    if (btnViewDetails != null) {
                        btnViewDetails.setOnClickListener(v -> {
                            // Show detailed security dialog
                            showSecurityDetailsDialog(category);
                        });
                    }
                }

                break;
            }
        }
    }

    private void setupObservers() {
        // Observers for global issues removed as they are now in IssuesFragment
    }

    private void setupFilters() {
        // Filter chips removed from layout
    }

    private void updateIssuesList() {
        // Issues list moved to BottomSheet and IssuesFragment
    }

    @Override
    public void onIssueClick(Issue issue) {
        // Method kept for compatibility with IssueAdapter in BottomSheet if needed,
        // but CategoryIssuesSheet handles its own adapter clicks.
    }

    /**
     * Show detailed security breakdown dialog
     */
    private void showSecurityDetailsDialog(AnalysisResponse.Category securityCategory) {
        // Create dialog
        android.app.AlertDialog.Builder builder = new android.app.AlertDialog.Builder(this);
        android.view.LayoutInflater inflater = getLayoutInflater();
        android.view.View dialogView = inflater.inflate(R.layout.dialog_security_details, null);
        builder.setView(dialogView);

        // Get views
        TextView tvOverallScore = dialogView.findViewById(R.id.tvOverallScore);
        TextView tvOverallGrade = dialogView.findViewById(R.id.tvOverallGrade);
        TextView tvTotalIssues = dialogView.findViewById(R.id.tvTotalIssues);
        TextView tvCriticalWarningCount = dialogView.findViewById(R.id.tvCriticalWarningCount);
        LinearLayout scannersContainer = dialogView.findViewById(R.id.scannersContainer);
        MaterialButton btnClose = dialogView.findViewById(R.id.btnClose);

        // Set data
        Integer score = securityCategory.getScore();
        if (score != null) {
            tvOverallScore.setText(score + "%");
            String grade = SecurityWarningHelper.getGrade(score);
            tvOverallGrade.setText("Grade: " + grade);

            // Set score color
            int scoreColor;
            if (score >= 90)
                scoreColor = getColor(R.color.success_green);
            else if (score >= 70)
                scoreColor = getColor(R.color.warning_orange);
            else
                scoreColor = getColor(R.color.critical_red);
            tvOverallScore.setTextColor(scoreColor);
        }

        // Count issues
        int totalIssues = securityCategory.getIssues() != null ? securityCategory.getIssues().size() : 0;
        int critical = 0, warning = 0;
        if (securityCategory.getIssues() != null) {
            for (Issue issue : securityCategory.getIssues()) {
                if (issue.isCritical())
                    critical++;
                else if (issue.isWarning())
                    warning++;
            }
        }

        tvTotalIssues.setText(totalIssues + " Issue" + (totalIssues != 1 ? "s" : ""));
        tvCriticalWarningCount.setText(critical + " Critical, " + warning + " Warnings");

        // Create dialog
        android.app.AlertDialog dialog = builder.create();
        dialog.getWindow()
                .setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));

        // Close button
        btnClose.setOnClickListener(v -> dialog.dismiss());

        dialog.show();
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
