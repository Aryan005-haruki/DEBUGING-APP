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
import com.healthchecker.ui.fragments.adapters.HistoryAdapter;
import com.healthchecker.ui.report.ReportActivity;
import com.healthchecker.utils.Constants;
import com.google.gson.Gson;

import java.util.List;

public class HistoryFragment extends Fragment {

    private HistoryViewModel viewModel;
    private HistoryAdapter adapter;
    private RecyclerView recyclerView;
    private View emptyState;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_history, container, false);

        recyclerView = view.findViewById(R.id.recyclerViewHistory);
        emptyState = view.findViewById(R.id.layoutEmptyState);

        setupRecyclerView();

        viewModel = new ViewModelProvider(this).get(HistoryViewModel.class);
        viewModel.getAllReports().observe(getViewLifecycleOwner(), this::updateUI);

        view.findViewById(R.id.btnClearHistory).setOnClickListener(v -> {
            new androidx.appcompat.app.AlertDialog.Builder(getContext())
                .setTitle("Clear History")
                .setMessage("Are you sure you want to delete all scan history?")
                .setPositiveButton("Delete", (dialog, which) -> viewModel.deleteAllReports())
                .setNegativeButton("Cancel", null)
                .show();
        });

        return view;
    }

    private void setupRecyclerView() {
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        adapter = new HistoryAdapter(this::onReportClick);
        recyclerView.setAdapter(adapter);
    }

    private void updateUI(List<ScanReportEntity> reports) {
        if (reports == null || reports.isEmpty()) {
            recyclerView.setVisibility(View.GONE);
            emptyState.setVisibility(View.VISIBLE);
        } else {
            recyclerView.setVisibility(View.VISIBLE);
            emptyState.setVisibility(View.GONE);
            adapter.setReports(reports);
        }
    }

    private void onReportClick(ScanReportEntity report) {
        Intent intent = new Intent(getActivity(), ReportActivity.class);
        intent.putExtra(Constants.EXTRA_REPORT_DATA, report.getReportJson());
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, report.getType());
        startActivity(intent);
    }
}
