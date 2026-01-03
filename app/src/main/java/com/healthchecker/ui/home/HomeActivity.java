package com.healthchecker.ui.home;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.View;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.google.android.material.card.MaterialCardView;
import com.healthchecker.R;
import com.healthchecker.ui.disclaimer.DisclaimerActivity;
import com.healthchecker.ui.input.ApkUploadActivity;
import com.healthchecker.ui.input.WebsiteInputActivity;
import com.healthchecker.utils.Constants;

public class HomeActivity extends AppCompatActivity {
    private HomeViewModel viewModel;
    private MaterialCardView cardWebsite, cardApk;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Check if disclaimer has been accepted
        SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
        boolean disclaimerAccepted = prefs.getBoolean(Constants.PREF_DISCLAIMER_ACCEPTED, false);

        if (!disclaimerAccepted) {
            Intent intent = new Intent(this, DisclaimerActivity.class);
            startActivity(intent);
            finish();
            return;
        }

        setContentView(R.layout.activity_home);

        viewModel = new ViewModelProvider(this).get(HomeViewModel.class);

        initViews();
        setupClickListeners();
    }

    private void initViews() {
        cardWebsite = findViewById(R.id.cardWebsite);
        cardApk = findViewById(R.id.cardApk);
    }

    private void setupClickListeners() {
        cardWebsite.setOnClickListener(v -> {
            viewModel.setAnalysisType(Constants.TYPE_WEBSITE);
            Intent intent = new Intent(HomeActivity.this, WebsiteInputActivity.class);
            startActivity(intent);
        });

        cardApk.setOnClickListener(v -> {
            viewModel.setAnalysisType(Constants.TYPE_APK);
            Intent intent = new Intent(HomeActivity.this, ApkUploadActivity.class);
            startActivity(intent);
        });
    }
}
