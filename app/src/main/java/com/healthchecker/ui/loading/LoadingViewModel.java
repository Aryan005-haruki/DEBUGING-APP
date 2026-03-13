package com.healthchecker.ui.loading;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;

import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.repository.AnalysisRepository;
import java.io.File;

public class LoadingViewModel extends AndroidViewModel {
    private final AnalysisRepository repository;

    public LoadingViewModel(@NonNull Application application) {
        super(application);
        repository = new AnalysisRepository(application);
    }

    public LiveData<AnalysisRepository.Result<AnalysisResponse>> analyzeWebsite(String url) {
        return repository.analyzeWebsite(url);
    }

    public LiveData<AnalysisRepository.Result<AnalysisResponse>> analyzeApk(File apkFile) {
        return repository.analyzeApk(apkFile);
    }
}
