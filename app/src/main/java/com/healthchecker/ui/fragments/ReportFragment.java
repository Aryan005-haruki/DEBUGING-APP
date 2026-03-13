package com.healthchecker.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.healthchecker.R;

import android.widget.TextView;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.mikhaellopez.circularprogressbar.CircularProgressBar;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.repository.AnalysisRepository;
import com.healthchecker.ui.report.ReportViewModel;
import com.healthchecker.ui.report.CategoryIssuesSheet;
import com.healthchecker.ui.report.adapters.CategoryAdapter;
import com.healthchecker.utils.SecurityWarningHelper;
import com.google.gson.Gson;

public class ReportFragment extends Fragment {

    private ReportViewModel viewModel;
    private AnalysisRepository repository;
    private TextView tvCriticalCount, tvWarningCount, tvPassedCount;
    private RecyclerView recyclerViewCategories;
    private CategoryAdapter categoryAdapter;
    private CircularProgressBar circularProgressHero;
    private TextView tvHeroScore, tvGrade, tvIssuesSummary;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_report, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        repository = new AnalysisRepository(requireContext());
        viewModel = new ViewModelProvider(this).get(ReportViewModel.class);

        initViews(view);
        observeLatestReport();
    }

    private void initViews(View view) {
        tvCriticalCount = view.findViewById(R.id.tvCriticalCount);
        tvWarningCount = view.findViewById(R.id.tvWarningCount);
        tvPassedCount = view.findViewById(R.id.tvPassedCount);
        recyclerViewCategories = view.findViewById(R.id.recyclerViewCategories);
        recyclerViewCategories.setLayoutManager(new LinearLayoutManager(requireContext()));

        circularProgressHero = view.findViewById(R.id.circularProgressHero);
        tvHeroScore = view.findViewById(R.id.tvHeroScore);
        tvGrade = view.findViewById(R.id.tvGrade);
        tvIssuesSummary = view.findViewById(R.id.tvIssuesSummary);
    }

    private void observeLatestReport() {
        repository.getLatestReport().observe(getViewLifecycleOwner(), entity -> {
            if (entity != null && entity.getReportJson() != null) {
                try {
                    AnalysisResponse.ReportData reportData = new Gson().fromJson(
                        entity.getReportJson(), 
                        AnalysisResponse.ReportData.class
                    );
                    bindData(reportData);
                } catch (Exception e) {
                    android.util.Log.e("ReportFragment", "Error parsing report JSON", e);
                }
            } else {
                // Show empty state if no reports
                showEmptyState();
            }
        });
    }

    private void bindData(AnalysisResponse.ReportData reportData) {
        if (reportData == null) return;
        
        viewModel.setReportData(reportData);

        // Set summary
        AnalysisResponse.Summary summary = reportData.getSummary();
        if (summary != null) {
            tvCriticalCount.setText(String.valueOf(summary.getCritical()));
            tvWarningCount.setText(String.valueOf(summary.getWarning()));
            tvPassedCount.setText(String.valueOf(summary.getPassed()));
            
            int totalIssues = summary.getCritical() + summary.getWarning();
            tvIssuesSummary.setText(totalIssues + " issues found");
        }

        // Setup category adapter
        if (reportData.getCategories() != null) {
            categoryAdapter = new CategoryAdapter(reportData.getCategories(), category -> {
                CategoryIssuesSheet sheet = CategoryIssuesSheet.newInstance(category);
                sheet.show(getChildFragmentManager(), "category_issues");
            });
            recyclerViewCategories.setAdapter(categoryAdapter);
            
            // Hero Score
            int overallScore = calculateOverallScore(reportData);
            tvHeroScore.setText(String.valueOf(overallScore));
            if (circularProgressHero != null) {
                circularProgressHero.setProgress(overallScore);
            }
            tvGrade.setText(SecurityWarningHelper.getGrade(overallScore));
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
        return count > 0 ? totalScore / count : 0;
    }

    private void showEmptyState() {
        tvHeroScore.setText("0");
        tvGrade.setText("N/A");
        tvIssuesSummary.setText("No recent scans found");
        tvCriticalCount.setText("0");
        tvWarningCount.setText("0");
        tvPassedCount.setText("0");
    }
}
