package com.healthchecker.ui.report;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.models.Issue;

import java.util.ArrayList;
import java.util.List;

public class ReportViewModel extends ViewModel {
    private final MutableLiveData<AnalysisResponse.ReportData> reportData = new MutableLiveData<>();
    private final MutableLiveData<String> selectedCategory = new MutableLiveData<>();
    private final MutableLiveData<String> selectedSeverityFilter = new MutableLiveData<>("ALL");

    public void setReportData(AnalysisResponse.ReportData data) {
        this.reportData.setValue(data);
    }

    public LiveData<AnalysisResponse.ReportData> getReportData() {
        return reportData;
    }

    public void setSelectedCategory(String category) {
        this.selectedCategory.setValue(category);
    }

    public LiveData<String> getSelectedCategory() {
        return selectedCategory;
    }

    public void setSeverityFilter(String filter) {
        this.selectedSeverityFilter.setValue(filter);
    }

    public LiveData<String> getSeverityFilter() {
        return selectedSeverityFilter;
    }

    public List<Issue> getFilteredIssues() {
        AnalysisResponse.ReportData data = reportData.getValue();
        String filter = selectedSeverityFilter.getValue();

        if (data == null || data.getCategories() == null) {
            android.util.Log.d("ReportViewModel", "No data or categories");
            return new ArrayList<>();
        }

        List<Issue> allIssues = new ArrayList<>();
        for (AnalysisResponse.Category category : data.getCategories()) {
            if (category.getIssues() != null) {
                android.util.Log.d("ReportViewModel",
                        "Category: " + category.getName() + " has " + category.getIssues().size() + " issues");
                allIssues.addAll(category.getIssues());
            }
        }

        android.util.Log.d("ReportViewModel",
                "Total issues before filter: " + allIssues.size() + ", Filter: " + filter);

        if ("ALL".equals(filter)) {
            android.util.Log.d("ReportViewModel", "Returning ALL " + allIssues.size() + " issues");
            return allIssues;
        } else if ("CRITICAL".equals(filter)) {
            List<Issue> filtered = new ArrayList<>();
            for (Issue issue : allIssues) {
                if (issue.isCritical()) {
                    filtered.add(issue);
                }
            }
            android.util.Log.d("ReportViewModel", "Filtered CRITICAL: " + filtered.size() + " issues");
            return filtered;
        } else if ("WARNING".equals(filter)) {
            List<Issue> filtered = new ArrayList<>();
            for (Issue issue : allIssues) {
                android.util.Log.d("ReportViewModel", "Checking issue: " + issue.getTitle() + " severity: "
                        + issue.getSeverity() + " isWarning: " + issue.isWarning());
                if (issue.isWarning()) {
                    filtered.add(issue);
                }
            }
            android.util.Log.d("ReportViewModel", "Filtered WARNING: " + filtered.size() + " issues");
            return filtered;
        }

        return allIssues;
    }
}
