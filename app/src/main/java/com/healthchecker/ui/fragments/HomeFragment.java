package com.healthchecker.ui.fragments;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.textfield.TextInputEditText;
import com.healthchecker.R;
import com.healthchecker.ui.loading.LoadingActivity;
import com.healthchecker.utils.Constants;
import java.util.List;

public class HomeFragment extends Fragment {

    private TextInputEditText etUrl;
    private MaterialButton btnStartScan;
    private RecyclerView recyclerViewRecentScans;
    private HistoryViewModel historyViewModel;
    private com.healthchecker.ui.fragments.adapters.HistoryAdapter historyAdapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        etUrl = view.findViewById(R.id.etUrl);
        btnStartScan = view.findViewById(R.id.btnStartScan);
        recyclerViewRecentScans = view.findViewById(R.id.recyclerViewRecentScans);
        View cardApkAnalysis = view.findViewById(R.id.cardApkAnalysis);

        btnStartScan.setOnClickListener(v -> handleWebsiteScan());

        if (cardApkAnalysis != null) {
            cardApkAnalysis.setOnClickListener(v -> {
                Intent intent = new Intent(getActivity(), com.healthchecker.ui.input.ApkUploadActivity.class);
                startActivity(intent);
            });
        }

        View cardCompareWebsites = view.findViewById(R.id.cardCompareWebsites);
        if (cardCompareWebsites != null) {
            cardCompareWebsites.setOnClickListener(v -> {
                Intent intent = new Intent(getActivity(), com.healthchecker.ui.comparison.ComparisonActivity.class);
                startActivity(intent);
            });
        }

        setupRecentScans(view);

        return view;
    }

    private void setupRecentScans(View view) {
        recyclerViewRecentScans.setLayoutManager(new androidx.recyclerview.widget.LinearLayoutManager(getContext()));

        historyViewModel = new androidx.lifecycle.ViewModelProvider(this).get(HistoryViewModel.class);

        View btnClearRecent = view.findViewById(R.id.btnClearRecent);
        if (btnClearRecent != null) {
            btnClearRecent.setOnClickListener(v -> {
                new androidx.appcompat.app.AlertDialog.Builder(getContext())
                    .setTitle("Clear Recent Scans")
                    .setMessage("Are you sure you want to clear your recent scan history?")
                    .setPositiveButton("Clear", (dialog, which) -> historyViewModel.deleteAllReports())
                    .setNegativeButton("Cancel", null)
                    .show();
            });
        }

        historyAdapter = new com.healthchecker.ui.fragments.adapters.HistoryAdapter(report -> {
            Intent intent = new Intent(getActivity(), com.healthchecker.ui.report.ReportActivity.class);
            intent.putExtra(Constants.EXTRA_REPORT_DATA, report.getReportJson());
            intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, report.getType());
            startActivity(intent);
        });
        recyclerViewRecentScans.setAdapter(historyAdapter);

        historyViewModel.getAllReports().observe(getViewLifecycleOwner(), reports -> {
            if (reports != null && !reports.isEmpty()) {
                // Show only first 5 recent scans
                List<com.healthchecker.data.local.ScanReportEntity> limited = reports.subList(0, Math.min(reports.size(), 5));
                historyAdapter.setReports(limited);
                recyclerViewRecentScans.setVisibility(View.VISIBLE);
            } else {
                recyclerViewRecentScans.setVisibility(View.GONE);
            }
        });
    }

    private void handleWebsiteScan() {
        String urlText = etUrl.getText().toString().trim();

        if (urlText.isEmpty()) {
            Toast.makeText(getContext(), "Please enter a website URL", Toast.LENGTH_SHORT).show();
            return;
        }

        // Add protocol if missing
        if (!urlText.startsWith("http://") && !urlText.startsWith("https://")) {
            urlText = "https://" + urlText;
        }

        // Navigate to LoadingActivity
        Intent intent = new Intent(getActivity(), LoadingActivity.class);
        intent.putExtra(Constants.EXTRA_URL, urlText);
        intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, Constants.TYPE_WEBSITE);
        startActivity(intent);
    }
}
