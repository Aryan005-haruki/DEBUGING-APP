package com.healthchecker.ui.report.adapters;

import android.graphics.Color;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.recyclerview.widget.RecyclerView;

import com.healthchecker.R;
import com.healthchecker.data.models.Issue;

import java.util.ArrayList;
import java.util.List;

public class IssueAdapter extends RecyclerView.Adapter<IssueAdapter.IssueViewHolder> {
    private List<Issue> issues = new ArrayList<>();
    private final OnIssueClickListener listener;

    public interface OnIssueClickListener {
        void onIssueClick(Issue issue);
    }

    public IssueAdapter(OnIssueClickListener listener) {
        this.listener = listener;
    }

    public void setIssues(List<Issue> issues) {
        this.issues = issues;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public IssueViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_issue, parent, false);
        return new IssueViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull IssueViewHolder holder, int position) {
        Issue issue = issues.get(position);
        holder.bind(issue, listener);
    }

    @Override
    public int getItemCount() {
        return issues.size();
    }

    static class IssueViewHolder extends RecyclerView.ViewHolder {
        private final CardView cardView;
        private final ImageView ivSeverityIcon;
        private final TextView tvSeverityBadge;
        private final TextView tvTitle;
        private final TextView tvDescription;

        public IssueViewHolder(@NonNull View itemView) {
            super(itemView);
            cardView = (CardView) itemView;
            ivSeverityIcon = itemView.findViewById(R.id.ivSeverityIcon);
            tvSeverityBadge = itemView.findViewById(R.id.tvSeverityBadge);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvDescription = itemView.findViewById(R.id.tvDescription);
        }

        public void bind(Issue issue, OnIssueClickListener listener) {
            tvTitle.setText(issue.getTitle());
            tvDescription.setText(issue.getDescription());
            tvSeverityBadge.setText(issue.getSeverity());

            // Set severity-based colors
            if (issue.isCritical()) {
                tvSeverityBadge.setTextColor(Color.parseColor("#D32F2F"));
                tvSeverityBadge.setBackgroundColor(Color.parseColor("#FFEBEE"));
            } else if (issue.isWarning()) {
                tvSeverityBadge.setTextColor(Color.parseColor("#F57C00"));
                tvSeverityBadge.setBackgroundColor(Color.parseColor("#FFF3E0"));
            } else {
                tvSeverityBadge.setTextColor(Color.parseColor("#388E3C"));
                tvSeverityBadge.setBackgroundColor(Color.parseColor("#E8F5E9"));
            }

            cardView.setOnClickListener(v -> listener.onIssueClick(issue));
        }
    }
}
