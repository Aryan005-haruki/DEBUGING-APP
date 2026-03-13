package com.healthchecker.ui.report;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.healthchecker.data.models.Issue;
import com.healthchecker.ui.fixsuggestion.FixSuggestionActivity;
import com.healthchecker.ui.report.adapters.IssueAdapter;
import com.healthchecker.utils.Constants;
import java.util.List;

public class CategoryIssuesSheet extends BottomSheetDialogFragment implements IssueAdapter.OnIssueClickListener {

    private AnalysisResponse.Category category;
    private List<Issue> issues;

    public static CategoryIssuesSheet newInstance(AnalysisResponse.Category category) {
        CategoryIssuesSheet sheet = new CategoryIssuesSheet();
        sheet.category = category;
        sheet.issues = category.getIssues();
        return sheet;
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.layout_category_issues_sheet, container, false);

        TextView tvTitle = view.findViewById(R.id.tvSheetTitle);
        TextView tvSubtitle = view.findViewById(R.id.tvSheetSubtitle);
        RecyclerView recyclerView = view.findViewById(R.id.recyclerViewCategoryIssues);
        View btnClose = view.findViewById(R.id.btnCloseSheet);

        if (category != null) {
            tvTitle.setText(category.getName());
            int count = (issues != null) ? issues.size() : 0;
            tvSubtitle.setText(count + " issue" + (count != 1 ? "s" : "") + " detected");
        }

        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        IssueAdapter adapter = new IssueAdapter(this);
        recyclerView.setAdapter(adapter);
        
        if (issues != null) {
            adapter.setIssues(issues);
        }

        btnClose.setOnClickListener(v -> dismiss());

        return view;
    }

    @Override
    public void onIssueClick(Issue issue) {
        Intent intent = new Intent(getActivity(), FixSuggestionActivity.class);
        intent.putExtra(Constants.EXTRA_ISSUE_DATA, issue);
        startActivity(intent);
    }
}
