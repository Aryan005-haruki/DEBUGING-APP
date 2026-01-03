package com.healthchecker.ui.home;

import androidx.lifecycle.ViewModel;

public class HomeViewModel extends ViewModel {
    private String selectedAnalysisType;

    public void setAnalysisType(String type) {
        this.selectedAnalysisType = type;
    }

    public String getSelectedAnalysisType() {
        return selectedAnalysisType;
    }
}
