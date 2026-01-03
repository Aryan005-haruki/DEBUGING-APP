package com.healthchecker.ui.fixsuggestion;

import android.os.Bundle;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.healthchecker.R;
import com.healthchecker.data.models.FixSuggestion;
import com.healthchecker.data.models.Issue;
import com.healthchecker.utils.Constants;

import java.util.List;

public class FixSuggestionActivity extends AppCompatActivity {
    private FixSuggestionViewModel viewModel;
    private TextView tvIssueTitle, tvIssueDescription, tvIssueImpact, tvFixSummary, tvFixSteps, tvResources;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_fix_suggestion);

        viewModel = new ViewModelProvider(this).get(FixSuggestionViewModel.class);

        initViews();
        loadIssueData();

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Fix Suggestion");
        }
    }

    private void initViews() {
        tvIssueTitle = findViewById(R.id.tvIssueTitle);
        tvIssueDescription = findViewById(R.id.tvIssueDescription);
        tvIssueImpact = findViewById(R.id.tvIssueImpact);
        tvFixSummary = findViewById(R.id.tvFixSummary);
        tvFixSteps = findViewById(R.id.tvFixSteps);
        tvResources = findViewById(R.id.tvResources);
    }

    private void loadIssueData() {
        Issue issue = (Issue) getIntent().getSerializableExtra(Constants.EXTRA_ISSUE_DATA);

        if (issue != null) {
            viewModel.setIssue(issue);

            // Display issue details
            tvIssueTitle.setText(issue.getTitle());
            tvIssueDescription.setText(issue.getDescription());
            tvIssueImpact.setText("Impact: " + issue.getImpact());

            // Display fix suggestion
            FixSuggestion fixSuggestion = issue.getFixSuggestion();
            if (fixSuggestion != null) {
                tvFixSummary.setText(fixSuggestion.getSummary());

                // Format steps
                List<String> steps = fixSuggestion.getSteps();
                if (steps != null && !steps.isEmpty()) {
                    StringBuilder stepsText = new StringBuilder();
                    for (int i = 0; i < steps.size(); i++) {
                        stepsText.append((i + 1)).append(". ").append(steps.get(i)).append("\n\n");
                    }
                    tvFixSteps.setText(stepsText.toString().trim());
                }

                // Format resources
                List<String> resources = fixSuggestion.getResources();
                if (resources != null && !resources.isEmpty()) {
                    StringBuilder resourcesText = new StringBuilder();
                    for (String resource : resources) {
                        resourcesText.append("• ").append(resource).append("\n");
                    }
                    tvResources.setText(resourcesText.toString().trim());
                }
            }
        }
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
