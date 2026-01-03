package com.healthchecker.ui.loading;

import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.healthchecker.R;

public class LoadingActivity extends AppCompatActivity {
    private ProgressBar progressBar;
    private TextView tvLoadingMessage;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_loading);

        progressBar = findViewById(R.id.progressBar);
        tvLoadingMessage = findViewById(R.id.tvLoadingMessage);

        // This activity can be used for showing loading during long operations
        // Currently, loading is handled in input activities themselves
    }
}
