package com.healthchecker.ui.loading;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import java.io.File;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.gson.Gson;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.ui.report.ReportActivity;
import com.healthchecker.utils.Constants;

public class LoadingActivity extends AppCompatActivity {
    private static final String TAG = "LoadingActivity";
    private ProgressBar progressBar;
    private TextView tvLoadingMessage;
    private LoadingViewModel viewModel;
    private String url;
    private String analysisType;
    private String url2;
    private boolean isComparison;
    private AnalysisResponse.ReportData firstReportData;
    private AnalysisResponse.ReportData secondReportData;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_loading);

        progressBar = findViewById(R.id.progressBar);
        tvLoadingMessage = findViewById(R.id.tvLoadingMessage);

        viewModel = new ViewModelProvider(this).get(LoadingViewModel.class);

        // Get URL and type from intent
        url = getIntent().getStringExtra(Constants.EXTRA_URL);
        url2 = getIntent().getStringExtra("url2");
        isComparison = getIntent().getBooleanExtra("is_comparison", false);
        analysisType = getIntent().getStringExtra(Constants.EXTRA_ANALYSIS_TYPE);

        Log.d(TAG, "Starting analysis for URL: " + url + (isComparison ? " and " + url2 : ""));

        // Start analysis
        if (Constants.TYPE_WEBSITE.equals(analysisType)) {
            if (isComparison) {
                tvLoadingMessage.setText("Comparing websites...\nThis may take some time");
                startComparisonScan();
            } else {
                tvLoadingMessage.setText("Analyzing website...\nThis may take up to 2 minutes");
                analyzeWebsite();
            }
        } else if (Constants.TYPE_APK.equals(analysisType)) {
            tvLoadingMessage.setText("Analyzing APK...\nScanning for vulnerabilities");
            analyzeApk();
        } else {
            Toast.makeText(this, "Invalid analysis type", Toast.LENGTH_SHORT).show();
            finish();
        }
    }

    private void startComparisonScan() {
        // First scan
        viewModel.analyzeWebsite(url).observe(this, result -> {
            if (result != null && result.isSuccess() && result.getData() != null) {
                firstReportData = result.getData().getData();
                checkComparisonReady();
            } else if (result != null && result.isError()) {
                handleError("Site 1: " + result.getMessage());
            }
        });

        // Second scan
        viewModel.analyzeWebsite(url2).observe(this, result -> {
            if (result != null && result.isSuccess() && result.getData() != null) {
                secondReportData = result.getData().getData();
                checkComparisonReady();
            } else if (result != null && result.isError()) {
                handleError("Site 2: " + result.getMessage());
            }
        });
    }

    private synchronized void checkComparisonReady() {
        if (firstReportData != null && secondReportData != null) {
            Intent intent = new Intent(this, com.healthchecker.ui.comparison.ComparisonReportActivity.class);
            Gson gson = new Gson();
            intent.putExtra("report_a", gson.toJson(firstReportData));
            intent.putExtra("report_b", gson.toJson(secondReportData));
            startActivity(intent);
            finish();
        }
    }

    private void handleError(String msg) {
        Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
        finish();
    }

    private void analyzeWebsite() {
        viewModel.analyzeWebsite(url).observe(this, this::handleAnalysisResult);
    }

    private void analyzeApk() {
        // ... (APK analysis logic)
        String apkPath = getIntent().getStringExtra("apk_path");
        if (apkPath != null) {
            File apkFile = new File(apkPath);
            viewModel.analyzeApk(apkFile).observe(this, result -> {
                handleAnalysisResult(result);
                if (result != null && !result.isLoading() && apkFile.exists()) {
                    apkFile.delete();
                }
            });
        }
    }

    private void handleAnalysisResult(com.healthchecker.data.repository.AnalysisRepository.Result<AnalysisResponse> result) {
        if (result != null) {
            if (result.isSuccess() && result.getData() != null) {
                AnalysisResponse response = result.getData();
                if (response != null && "success".equals(response.getStatus()) && response.getData() != null) {
                    navigateToReport(response.getData());
                } else {
                    handleError(response != null ? response.getMessage() : "Analysis failed");
                }
            } else if (result.isError()) {
                handleError(result.getMessage());
            }
        }
    }

    private void navigateToReport(AnalysisResponse.ReportData reportData) {
        Intent intent = new Intent(this, ReportActivity.class);
        intent.putExtra(Constants.EXTRA_REPORT_DATA, new Gson().toJson(reportData));
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, analysisType);
        startActivity(intent);
        finish();
    }
}
