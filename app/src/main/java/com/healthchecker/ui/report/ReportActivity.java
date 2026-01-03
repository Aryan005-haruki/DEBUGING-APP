package com.healthchecker.ui.report;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.chip.Chip;
import com.google.android.material.chip.ChipGroup;
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

public class ReportActivity extends AppCompatActivity implements IssueAdapter.OnIssueClickListener {
    private ReportViewModel viewModel;
    private TextView tvTitle, tvAnalyzedTime, tvCriticalCount, tvWarningCount, tvPassedCount;
    private ChipGroup chipGroupFilters;
    private RecyclerView recyclerViewCategories, recyclerViewIssues;
    private CategoryAdapter categoryAdapter;
    private IssueAdapter issueAdapter;
    private View securityWarningBanner;
    private SecurityWarningHelper securityHelper;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_report);

        viewModel = new ViewModelProvider(this).get(ReportViewModel.class);
        securityHelper = new SecurityWarningHelper(this);

        initViews();
        loadReportData();
        setupObservers();
        setupFilters();

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
        chipGroupFilters = findViewById(R.id.chipGroupFilters);
        recyclerViewCategories = findViewById(R.id.recyclerViewCategories);
        recyclerViewIssues = findViewById(R.id.recyclerViewIssues);
        securityWarningBanner = findViewById(R.id.securityWarningBanner);

        // Setup RecyclerViews
        recyclerViewCategories.setLayoutManager(new LinearLayoutManager(this));
        recyclerViewIssues.setLayoutManager(new LinearLayoutManager(this));

        issueAdapter = new IssueAdapter(this);
        recyclerViewIssues.setAdapter(issueAdapter);
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
            tvCriticalCount.setText(String.valueOf(summary.getCritical()));
            tvWarningCount.setText(String.valueOf(summary.getWarning()));
            tvPassedCount.setText(String.valueOf(summary.getPassed()));

            // Setup category adapter
            categoryAdapter = new CategoryAdapter(reportData.getCategories());
            recyclerViewCategories.setAdapter(categoryAdapter);

            // Display security warning if applicable (Phase 2)
            displaySecurityWarning(reportData);
        }
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
                            // Scroll to security category or filter to show only security issues
                            // For now, just scroll to top of issues list
                            recyclerViewIssues.smoothScrollToPosition(0);
                        });
                    }
                }

                break;
            }
        }
    }

    private void setupObservers() {
        viewModel.getSeverityFilter().observe(this, filter -> {
            updateIssuesList();
        });
    }

    private void setupFilters() {
        Chip chipAll = findViewById(R.id.chipAll);
        Chip chipCritical = findViewById(R.id.chipCritical);
        Chip chipWarning = findViewById(R.id.chipWarning);

        chipAll.setOnClickListener(v -> viewModel.setSeverityFilter("ALL"));
        chipCritical.setOnClickListener(v -> viewModel.setSeverityFilter("CRITICAL"));
        chipWarning.setOnClickListener(v -> viewModel.setSeverityFilter("WARNING"));
    }

    private void updateIssuesList() {
        issueAdapter.setIssues(viewModel.getFilteredIssues());
    }

    @Override
    public void onIssueClick(Issue issue) {
        // Navigate to fix suggestion screen
        Intent intent = new Intent(this, FixSuggestionActivity.class);
        intent.putExtra(Constants.EXTRA_ISSUE_DATA, issue);
        startActivity(intent);
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
