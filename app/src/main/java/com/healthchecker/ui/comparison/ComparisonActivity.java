package com.healthchecker.ui.comparison;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.healthchecker.R;
import com.healthchecker.ui.loading.LoadingActivity;
import com.healthchecker.utils.Constants;

public class ComparisonActivity extends AppCompatActivity {

    private TextInputEditText etUrl1, etUrl2;
    private MaterialButton btnDoCompare;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_comparison);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Website Comparison");
        }

        etUrl1 = findViewById(R.id.etUrl1);
        etUrl2 = findViewById(R.id.etUrl2);
        btnDoCompare = findViewById(R.id.btnDoCompare);

        btnDoCompare.setOnClickListener(v -> handleComparison());
    }

    private void handleComparison() {
        String url1 = etUrl1.getText().toString().trim();
        String url2 = etUrl2.getText().toString().trim();

        if (url1.isEmpty() || url2.isEmpty()) {
            Toast.makeText(this, "Please enter both URLs", Toast.LENGTH_SHORT).show();
            return;
        }

        // Add protocols
        if (!url1.startsWith("http")) url1 = "https://" + url1;
        if (!url2.startsWith("http")) url2 = "https://" + url2;

        // For simplicity, we'll start a "Comparison Loading" flow
        // or just let the user know we're working on it.
        // Actually, we can pass both to a LoadingActivity that handles dual scans.
        
        Intent intent = new Intent(this, com.healthchecker.ui.loading.LoadingActivity.class);
        intent.putExtra(Constants.EXTRA_URL, url1);
        intent.putExtra("url2", url2);
        intent.putExtra("is_comparison", true);
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, Constants.TYPE_WEBSITE);
        startActivity(intent);
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
