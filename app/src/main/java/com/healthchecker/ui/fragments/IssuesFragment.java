package com.healthchecker.ui.fragments;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.healthchecker.R;

public class IssuesFragment extends Fragment {

    private RecyclerView recyclerViewIssues;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_issues, container, false);

        recyclerViewIssues = view.findViewById(R.id.recyclerViewIssues);
        recyclerViewIssues.setLayoutManager(new LinearLayoutManager(getContext()));

        return view;
    }
}
