package com.healthchecker.ui.input;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.card.MaterialCardView;
import com.google.gson.Gson;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.ui.report.ReportActivity;
import com.healthchecker.utils.Constants;
import com.healthchecker.utils.FileUtils;

import java.io.File;

public class ApkUploadActivity extends AppCompatActivity {
    private InputViewModel viewModel;
    private MaterialCardView cardFileSelector;
    private TextView tvFileName, tvFileSize, tvNoFileSelected;
    private Button btnAnalyze;
    private Uri selectedFileUri;

    private final ActivityResultLauncher<String> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri != null) {
                    handleSelectedFile(uri);
                }
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_apk_upload);

        viewModel = new ViewModelProvider(this).get(InputViewModel.class);

        initViews();
        setupClickListeners();
    }

    private void initViews() {
        cardFileSelector = findViewById(R.id.cardFileSelector);
        tvFileName = findViewById(R.id.tvFileName);
        tvFileSize = findViewById(R.id.tvFileSize);
        tvNoFileSelected = findViewById(R.id.tvNoFileSelected);
        btnAnalyze = findViewById(R.id.btnAnalyze);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("APK Analysis");
        }

        btnAnalyze.setEnabled(false);
    }

    private void setupClickListeners() {
        cardFileSelector.setOnClickListener(v -> {
            filePickerLauncher.launch("application/vnd.android.package-archive");
        });

        btnAnalyze.setOnClickListener(v -> {
            if (selectedFileUri != null) {
                startAnalysis();
            }
        });
    }

    private void handleSelectedFile(Uri uri) {
        selectedFileUri = uri;

        // Get file info
        String fileName = FileUtils.getFileName(this, uri);
        long fileSize = FileUtils.getFileSize(this, uri);

        // Check file size (max 50MB)
        if (fileSize > Constants.MAX_APK_SIZE_MB * 1024 * 1024) {
            Toast.makeText(this, "File size exceeds " + Constants.MAX_APK_SIZE_MB + " MB limit", Toast.LENGTH_LONG)
                    .show();
            selectedFileUri = null;
            return;
        }

        // Update UI
        tvNoFileSelected.setVisibility(TextView.GONE);
        tvFileName.setVisibility(TextView.VISIBLE);
        tvFileSize.setVisibility(TextView.VISIBLE);
        tvFileName.setText(fileName);
        tvFileSize.setText(FileUtils.formatFileSize(fileSize));
        btnAnalyze.setEnabled(true);
    }

    private void startAnalysis() {
        btnAnalyze.setEnabled(false);
        btnAnalyze.setText("Analyzing...");

        try {
            File apkFile = FileUtils.getFileFromUri(this, selectedFileUri);

            viewModel.analyzeApk(apkFile).observe(this, result -> {
                if (result.isLoading()) {
                    // Show loading state
                } else if (result.isSuccess()) {
                    btnAnalyze.setEnabled(true);
                    btnAnalyze.setText("Analyze APK");

                    AnalysisResponse response = result.getData();
                    if (response != null && "success".equals(response.getStatus())) {
                        // Navigate to report
                        Intent intent = new Intent(this, ReportActivity.class);
                        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, Constants.TYPE_APK);

                        // Pass report data as JSON
                        Gson gson = new Gson();
                        String reportJson = gson.toJson(response.getData());
                        intent.putExtra(Constants.EXTRA_REPORT_DATA, reportJson);

                        startActivity(intent);

                        // Clean up temp file
                        if (apkFile.exists()) {
                            apkFile.delete();
                        }
                    } else {
                        Toast.makeText(this, "Analysis failed", Toast.LENGTH_SHORT).show();
                    }
                } else if (result.isError()) {
                    btnAnalyze.setEnabled(true);
                    btnAnalyze.setText("Analyze APK");
                    Toast.makeText(this, result.getMessage(), Toast.LENGTH_LONG).show();
                }
            });

        } catch (Exception e) {
            btnAnalyze.setEnabled(true);
            btnAnalyze.setText("Analyze APK");
            Toast.makeText(this, "Error reading file: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
