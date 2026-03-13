package com.healthchecker.ui.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.healthchecker.R;
import com.healthchecker.data.local.ScanReportEntity;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.models.Issue;
import com.healthchecker.ui.report.adapters.IssueAdapter;
import com.healthchecker.ui.fixsuggestion.FixSuggestionActivity;
import com.healthchecker.utils.Constants;
import com.google.gson.Gson;
import android.widget.EditText;
import android.text.Editable;
import android.text.TextWatcher;
import android.widget.PopupMenu;
import android.widget.ImageView;

import java.util.ArrayList;
import java.util.List;

public class IssuesFragment extends Fragment implements IssueAdapter.OnIssueClickListener {

    private HistoryViewModel viewModel;
    private IssueAdapter adapter;
    private RecyclerView recyclerView;
    private View emptyState;
    private EditText searchInput;
    private ImageView btnFilter;
    private List<Issue> allIssuesList = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_issues, container, false);

        recyclerView = view.findViewById(R.id.recyclerViewIssues);
        emptyState = view.findViewById(R.id.layoutEmptyState);
        searchInput = view.findViewById(R.id.searchInput);
        btnFilter = view.findViewById(R.id.btnFilter);

        setupRecyclerView();
        setupSearchAndFilter();

        viewModel = new ViewModelProvider(this).get(HistoryViewModel.class);
        viewModel.getLatestReport().observe(getViewLifecycleOwner(), this::processLatestReport);

        return view;
    }

    private void setupSearchAndFilter() {
        if (searchInput != null) {
            searchInput.addTextChangedListener(new TextWatcher() {
                @Override
                public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

                @Override
                public void onTextChanged(CharSequence s, int start, int before, int count) {
                    filterIssues(s.toString(), "ALL");
                }

                @Override
                public void afterTextChanged(Editable s) {}
            });
        }

        if (btnFilter != null) {
            btnFilter.setOnClickListener(v -> {
                PopupMenu popup = new PopupMenu(getContext(), v);
                popup.getMenu().add(0, 0, 0, "All Levels");
                popup.getMenu().add(0, 1, 1, "Critical Only");
                popup.getMenu().add(0, 2, 2, "Warning Only");
                
                popup.setOnMenuItemClickListener(item -> {
                    String level = "ALL";
                    if (item.getItemId() == 1) level = "CRITICAL";
                    else if (item.getItemId() == 2) level = "WARNING";
                    
                    filterIssues(searchInput.getText().toString(), level);
                    return true;
                });
                popup.show();
            });
        }
    }

    private void filterIssues(String query, String level) {
        List<Issue> filtered = new ArrayList<>();
        for (Issue issue : allIssuesList) {
            boolean matchesQuery = issue.getTitle().toLowerCase().contains(query.toLowerCase()) ||
                    issue.getDescription().toLowerCase().contains(query.toLowerCase());
            
            boolean matchesLevel = level.equals("ALL") || 
                    (level.equals("CRITICAL") && issue.isCritical()) ||
                    (level.equals("WARNING") && issue.isWarning());

            if (matchesQuery && matchesLevel) {
                filtered.add(issue);
            }
        }
        adapter.setIssues(filtered);
    }

    private void setupRecyclerView() {
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new IssueAdapter(this);
        recyclerView.setAdapter(adapter);
    }

    private void processLatestReport(ScanReportEntity report) {
        if (report == null) {
            showEmptyState();
            return;
        }

        AnalysisResponse.ReportData data = new Gson().fromJson(report.getReportJson(), AnalysisResponse.ReportData.class);
        if (data == null || data.getCategories() == null) {
            showEmptyState();
            return;
        }

        List<Issue> allIssues = new ArrayList<>();
        for (AnalysisResponse.Category category : data.getCategories()) {
            if (category.getIssues() != null) {
                allIssues.addAll(category.getIssues());
            }
        }

        if (allIssues.isEmpty()) {
            showEmptyState();
        } else {
            recyclerView.setVisibility(View.VISIBLE);
            emptyState.setVisibility(View.GONE);
            this.allIssuesList = allIssues;
            adapter.setIssues(allIssuesList);
        }
    }

    private void showEmptyState() {
        recyclerView.setVisibility(View.GONE);
        emptyState.setVisibility(View.VISIBLE);
    }

    @Override
    public void onIssueClick(Issue issue) {
        Intent intent = new Intent(getActivity(), FixSuggestionActivity.class);
        intent.putExtra(Constants.EXTRA_ISSUE_DATA, issue);
        startActivity(intent);
    }
}
