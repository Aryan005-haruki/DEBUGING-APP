package com.healthchecker.ui.input;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.textfield.TextInputEditText;
import com.google.android.material.textfield.TextInputLayout;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.ui.loading.LoadingActivity;
import com.healthchecker.ui.report.ReportActivity;
import com.healthchecker.utils.Constants;
import com.google.gson.Gson;

public class WebsiteInputActivity extends AppCompatActivity {
    private InputViewModel viewModel;
    private TextInputLayout inputLayoutUrl;
    private TextInputEditText editTextUrl;
    private Button btnAnalyze;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_website_input);

        viewModel = new ViewModelProvider(this).get(InputViewModel.class);

        initViews();
        setupClickListeners();
    }

    private void initViews() {
        inputLayoutUrl = findViewById(R.id.inputLayoutUrl);
        editTextUrl = findViewById(R.id.editTextUrl);
        btnAnalyze = findViewById(R.id.btnAnalyze);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Website Analysis");
        }
    }

    private void setupClickListeners() {
        btnAnalyze.setOnClickListener(v -> {
            String url = editTextUrl.getText().toString().trim();

            if (url.isEmpty()) {
                inputLayoutUrl.setError("Please enter a URL");
                return;
            }

            if (!viewModel.isValidUrl(url)) {
                inputLayoutUrl.setError("Please enter a valid URL");
                return;
            }

            inputLayoutUrl.setError(null);
            startAnalysis(url);
        });
    }

    private void startAnalysis(String url) {
        // Centralize analysis flow via LoadingActivity
        Intent intent = new Intent(this, LoadingActivity.class);
        intent.putExtra(Constants.EXTRA_URL, url);
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, Constants.TYPE_WEBSITE);
        startActivity(intent);
        finish();
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
