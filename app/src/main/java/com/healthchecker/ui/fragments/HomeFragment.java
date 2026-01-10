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

public class HomeFragment extends Fragment {

    private TextInputEditText etUrl;
    private MaterialButton btnStartScan;
    private RecyclerView recyclerViewRecentScans;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_home, container, false);

        etUrl = view.findViewById(R.id.etUrl);
        btnStartScan = view.findViewById(R.id.btnStartScan);
        recyclerViewRecentScans = view.findViewById(R.id.recyclerViewRecentScans);

        btnStartScan.setOnClickListener(v -> {
            String url = etUrl.getText().toString().trim();

            // Validate URL
            if (url.isEmpty()) {
                Toast.makeText(getContext(), "Please enter a website URL", Toast.LENGTH_SHORT).show();
                return;
            }

            // Add protocol if missing
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
            }

            // Start analysis directly - Go to LoadingActivity
            Intent intent = new Intent(getActivity(), LoadingActivity.class);
            intent.putExtra(Constants.EXTRA_URL, url);
            intent.putExtra(Constants.EXTRA_ANALYSIS_TYPE, Constants.TYPE_WEBSITE);
            startActivity(intent);
        });

        return view;
    }
}
