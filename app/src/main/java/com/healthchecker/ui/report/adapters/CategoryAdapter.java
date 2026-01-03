package com.healthchecker.ui.report.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.card.MaterialCardView;
import com.healthchecker.R;
import com.healthchecker.data.models.AnalysisResponse;

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
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_category, parent, false);
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
        private final TextView tvCategoryName;
        private final TextView tvScore;
        private final TextView tvIssueCount;

        public CategoryViewHolder(@NonNull View itemView) {
            super(itemView);
            cardView = itemView.findViewById(R.id.cardCategory);
            tvCategoryName = itemView.findViewById(R.id.tvCategoryName);
            tvScore = itemView.findViewById(R.id.tvScore);
            tvIssueCount = itemView.findViewById(R.id.tvIssueCount);
        }

        public void bind(AnalysisResponse.Category category) {
            tvCategoryName.setText(category.getName());

            // Show score if available
            if (category.getScore() != null) {
                tvScore.setVisibility(View.VISIBLE);
                tvScore.setText(category.getScore() + "/100");
            } else {
                tvScore.setVisibility(View.GONE);
            }

            // Show issue count
            int issueCount = category.getIssues() != null ? category.getIssues().size() : 0;
            if (issueCount > 0) {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText(issueCount + " issue" + (issueCount > 1 ? "s" : ""));
            } else {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText("✓ Passed");
            }
        }
    }
}
