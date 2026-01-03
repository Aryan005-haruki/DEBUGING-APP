package com.healthchecker.ui.fixsuggestion;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.healthchecker.data.models.Issue;

public class FixSuggestionViewModel extends ViewModel {
    private final MutableLiveData<Issue> currentIssue = new MutableLiveData<>();

    public void setIssue(Issue issue) {
        this.currentIssue.setValue(issue);
    }

    public LiveData<Issue> getIssue() {
        return currentIssue;
    }
}
