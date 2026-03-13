package com.healthchecker.ui.fragments;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import com.healthchecker.data.local.ScanReportEntity;
import com.healthchecker.data.repository.AnalysisRepository;
import java.util.List;

public class HistoryViewModel extends AndroidViewModel {
    private final AnalysisRepository repository;

    public HistoryViewModel(@NonNull Application application) {
        super(application);
        repository = new AnalysisRepository(application);
    }

    public LiveData<List<ScanReportEntity>> getAllReports() {
        return repository.getAllReports();
    }

    public LiveData<ScanReportEntity> getLatestReport() {
        return repository.getLatestReport();
    }

    public void deleteAllReports() {
        repository.deleteAllReports();
    }
}
