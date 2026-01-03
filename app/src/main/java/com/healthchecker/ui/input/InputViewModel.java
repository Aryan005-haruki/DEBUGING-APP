package com.healthchecker.ui.input;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.repository.AnalysisRepository;

import java.io.File;

public class InputViewModel extends ViewModel {
    private final AnalysisRepository repository;
    private final MutableLiveData<String> url = new MutableLiveData<>();
    private final MutableLiveData<File> selectedApkFile = new MutableLiveData<>();

    public InputViewModel() {
        this.repository = new AnalysisRepository();
    }

    public void setUrl(String url) {
        this.url.setValue(url);
    }

    public LiveData<String> getUrl() {
        return url;
    }

    public void setSelectedApkFile(File file) {
        this.selectedApkFile.setValue(file);
    }

    public LiveData<File> getSelectedApkFile() {
        return selectedApkFile;
    }

    public LiveData<AnalysisRepository.Result<AnalysisResponse>> analyzeWebsite(String websiteUrl) {
        return repository.analyzeWebsite(websiteUrl);
    }

    public LiveData<AnalysisRepository.Result<AnalysisResponse>> analyzeApk(File apkFile) {
        return repository.analyzeApk(apkFile);
    }

    public boolean isValidUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return false;
        }

        String urlPattern = "^(https?://)?([\\da-z\\.-]+)\\.([a-z\\.]{2,6})([/\\w \\.-]*)*/?$";
        return url.matches(urlPattern);
    }
}
