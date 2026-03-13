package com.healthchecker.ui.comparison;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

import com.google.gson.Gson;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.utils.SecurityWarningHelper;

import java.util.HashMap;
import java.util.Map;

public class ComparisonReportActivity extends AppCompatActivity {

    private AnalysisResponse.ReportData dataA, dataB;
    private LinearLayout comparisonContainer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_comparison_report);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Comparison Results");
        }

        comparisonContainer = findViewById(R.id.comparisonContainer);

        String jsonA = getIntent().getStringExtra("report_a");
        String jsonB = getIntent().getStringExtra("report_b");

        Gson gson = new Gson();
        dataA = gson.fromJson(jsonA, AnalysisResponse.ReportData.class);
        dataB = gson.fromJson(jsonB, AnalysisResponse.ReportData.class);

        setupHeader();
        populateComparison();
    }

    private void setupHeader() {
        ((TextView) findViewById(R.id.tvSiteA)).setText(cleanUrl(dataA.getUrl()));
        ((TextView) findViewById(R.id.tvSiteB)).setText(cleanUrl(dataB.getUrl()));

        int scoreA = calculateOverallScore(dataA);
        int scoreB = calculateOverallScore(dataB);

        ((TextView) findViewById(R.id.tvScoreA)).setText(String.valueOf(scoreA));
        ((TextView) findViewById(R.id.tvScoreB)).setText(String.valueOf(scoreB));

        ((TextView) findViewById(R.id.tvGradeA)).setText("Grade " + SecurityWarningHelper.getGrade(scoreA));
        ((TextView) findViewById(R.id.tvGradeB)).setText("Grade " + SecurityWarningHelper.getGrade(scoreB));
    }

    private String cleanUrl(String url) {
        if (url == null) return "Unknown";
        return url.replace("https://", "").replace("http://", "").replace("www.", "");
    }

    private int calculateOverallScore(AnalysisResponse.ReportData data) {
        if (data == null || data.getCategories() == null || data.getCategories().isEmpty()) return 0;
        int total = 0, count = 0;
        for (AnalysisResponse.Category cat : data.getCategories()) {
            if (cat.getScore() != null) {
                total += cat.getScore();
                count++;
            }
        }
        return count > 0 ? total / count : 0;
    }

    private void populateComparison() {
        Map<String, AnalysisResponse.Category> mapB = new HashMap<>();
        if (dataB.getCategories() != null) {
            for (AnalysisResponse.Category cat : dataB.getCategories()) {
                mapB.put(cat.getName(), cat);
            }
        }

        if (dataA.getCategories() != null) {
            for (AnalysisResponse.Category catA : dataA.getCategories()) {
                AnalysisResponse.Category catB = mapB.get(catA.getName());
                addStatRow(catA.getName(), 
                    catA.getScore() != null ? catA.getScore() + "%" : "N/A",
                    catB != null && catB.getScore() != null ? catB.getScore() + "%" : "N/A");
            }
        }
    }

    private void addStatRow(String name, String valA, String valB) {
        View view = LayoutInflater.from(this).inflate(R.layout.item_comparison_stat, comparisonContainer, false);
        ((TextView) view.findViewById(R.id.tvCategoryName)).setText(name);
        ((TextView) view.findViewById(R.id.tvValA)).setText(valA);
        ((TextView) view.findViewById(R.id.tvValB)).setText(valB);
        comparisonContainer.addView(view);
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
