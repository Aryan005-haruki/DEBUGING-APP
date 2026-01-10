package com.healthchecker.ui.loading;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.ViewModel;

import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.repository.AnalysisRepository;

public class LoadingViewModel extends ViewModel {
    private final AnalysisRepository repository;

    public LoadingViewModel() {
        repository = new AnalysisRepository();
    }

    public LiveData<AnalysisRepository.Result<AnalysisResponse>> analyzeWebsite(String url) {
        return repository.analyzeWebsite(url);
    }
}
