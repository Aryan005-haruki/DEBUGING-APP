package com.healthchecker.ui.loading;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
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

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_loading);

        progressBar = findViewById(R.id.progressBar);
        tvLoadingMessage = findViewById(R.id.tvLoadingMessage);

        viewModel = new ViewModelProvider(this).get(LoadingViewModel.class);

        // Get URL and type from intent
        url = getIntent().getStringExtra(Constants.EXTRA_URL);
        analysisType = getIntent().getStringExtra(Constants.EXTRA_ANALYSIS_TYPE);

        Log.d(TAG, "Starting analysis for URL: " + url);

        // Start analysis
        if (Constants.TYPE_WEBSITE.equals(analysisType)) {
            tvLoadingMessage.setText("Analyzing website...\nThis may take up to 2 minutes");
        } else {
            Toast.makeText(this, "Invalid analysis type", Toast.LENGTH_SHORT).show();
            finish();
        }

        // Observe analysis result (this triggers the API call)
        setupObservers();
    }

    private void analyzeWebsite() {
        tvLoadingMessage.setText("Analyzing website...\nThis may take up to 2 minutes");
        viewModel.analyzeWebsite(url);
    }

    private void setupObservers() {
        viewModel.analyzeWebsite(url).observe(this, result -> {
            if (result != null) {
                if (result.isSuccess() && result.getData() != null) {
                    // Success - get report data
                    AnalysisResponse response = result.getData();
                    if (response != null && response.isSuccess() && response.getData() != null) {
                        Log.d(TAG, "Analysis complete, navigating to report");
                        navigateToReport(response.getData());
                    } else {
                        String errorMsg = response != null ? response.getMessage() : "Analysis failed";
                        Log.e(TAG, "Analysis error: " + errorMsg);
                        Toast.makeText(this, "Error: " + errorMsg, Toast.LENGTH_LONG).show();
                        finish();
                    }
                } else if (result.isError()) {
                    // Network or API error
                    Log.e(TAG, "Network error: " + result.getMessage());
                    Toast.makeText(this, "Error: " + result.getMessage(), Toast.LENGTH_LONG).show();
                    finish();
                }
            }
        });
    }

    private void navigateToReport(AnalysisResponse.ReportData reportData) {
        Intent intent = new Intent(this, ReportActivity.class);

        // Convert report data to JSON
        Gson gson = new Gson();
        String reportJson = gson.toJson(reportData);

        intent.putExtra(Constants.EXTRA_REPORT_DATA, reportJson);
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, analysisType);

        startActivity(intent);
        finish();
    }
}
