package com.healthchecker.ui.report.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.card.MaterialCardView;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;
import com.mikhaellopez.circularprogressbar.CircularProgressBar;

import java.util.ArrayList;
import java.util.List;

public class CategoryAdapter extends RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder> {
    private List<AnalysisResponse.Category> categories = new ArrayList<>();

    public CategoryAdapter(List<AnalysisResponse.Category> categories) {
        if (categories != null) {
            this.categories = categories;
        }
    }

    @NonNull
    @Override
    public CategoryViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_category_premium, parent, false);
        return new CategoryViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull CategoryViewHolder holder, int position) {
        AnalysisResponse.Category category = categories.get(position);
        holder.bind(category);
    }

    @Override
    public int getItemCount() {
        return categories.size();
    }

    static class CategoryViewHolder extends RecyclerView.ViewHolder {
        private final MaterialCardView cardView;
        private final CircularProgressBar circularProgress;
        private final TextView tvScoreCenter;
        private final TextView tvCategoryName;
        private final TextView tvIssueCount;
        private final TextView tvBadge;

        public CategoryViewHolder(@NonNull View itemView) {
            super(itemView);
            cardView = itemView.findViewById(R.id.cardCategory);
            circularProgress = itemView.findViewById(R.id.circularProgress);
            tvScoreCenter = itemView.findViewById(R.id.tvScoreCenter);
            tvCategoryName = itemView.findViewById(R.id.tvCategoryName);
            tvIssueCount = itemView.findViewById(R.id.tvIssueCount);
            tvBadge = itemView.findViewById(R.id.tvBadge);
        }

        public void bind(AnalysisResponse.Category category) {
            tvCategoryName.setText(category.getName());

            // Get score or calculate from issues
            Integer score = category.getScore();
            int issueCount = category.getIssues() != null ? category.getIssues().size() : 0;

            // If score is available, show it in circular progress
            if (score != null) {
                tvScoreCenter.setText(String.valueOf(score));
                circularProgress.setProgress((float) score);

                // Set color based on score
                int color = getScoreColor(score);
                circularProgress.setProgressBarColor(color);
            } else {
                // No score - show based on issues
                if (issueCount == 0) {
                    tvScoreCenter.setText("✓");
                    circularProgress.setProgress(100f);
                    circularProgress.setProgressBarColor(
                            ContextCompat.getColor(itemView.getContext(), R.color.vibrant_success));
                } else {
                    tvScoreCenter.setText(String.valueOf(issueCount));
                    circularProgress.setProgress(0f);
                    circularProgress.setProgressBarColor(
                            ContextCompat.getColor(itemView.getContext(), R.color.vibrant_critical));
                }
            }

            // Show issue count
            if (issueCount > 0) {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText(issueCount + " issue" + (issueCount > 1 ? "s" : "") + " found");

                // Show badge for critical categories
                if (issueCount >= 5) {
                    tvBadge.setVisibility(View.VISIBLE);
                    tvBadge.setText("HIGH");
                    tvBadge.setBackgroundResource(R.drawable.bg_badge_high);
                } else if (issueCount >= 2) {
                    tvBadge.setVisibility(View.VISIBLE);
                    tvBadge.setText("MEDIUM");
                    tvBadge.setBackgroundResource(R.drawable.bg_badge_medium);
                } else {
                    tvBadge.setVisibility(View.GONE);
                }
            } else {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText("✓ All checks passed");
                tvBadge.setVisibility(View.GONE);
            }
        }

        private int getScoreColor(int score) {
            if (score >= 90) {
                return ContextCompat.getColor(itemView.getContext(), R.color.progress_excellent);
            } else if (score >= 70) {
                return ContextCompat.getColor(itemView.getContext(), R.color.progress_good);
            } else if (score >= 50) {
                return ContextCompat.getColor(itemView.getContext(), R.color.progress_fair);
            } else {
                return ContextCompat.getColor(itemView.getContext(), R.color.progress_poor);
            }
        }
    }
}
