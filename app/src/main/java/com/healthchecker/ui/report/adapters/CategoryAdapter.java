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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CategoryAdapter extends RecyclerView.Adapter<CategoryAdapter.CategoryViewHolder> {
    private List<AnalysisResponse.Category> categories = new ArrayList<>();
    private final OnCategoryClickListener listener;

    // Category icons for clean visual identification
    private static final Map<String, String> CATEGORY_ICONS = new HashMap<>();
    static {
        CATEGORY_ICONS.put("Performance", "⚡");
        CATEGORY_ICONS.put("SEO", "🔍");
        CATEGORY_ICONS.put("Accessibility", "♿");
        CATEGORY_ICONS.put("Security", "🛡️");
        CATEGORY_ICONS.put("Code Quality", "💻");
        CATEGORY_ICONS.put("Broken Links", "🔗");
        CATEGORY_ICONS.put("DNS & Email Security", "🌐");
        CATEGORY_ICONS.put("Technology Stack", "🧬");
        CATEGORY_ICONS.put("Domain Intelligence", "🏢");
        CATEGORY_ICONS.put("Network Performance", "📊");
        CATEGORY_ICONS.put("Redirect Chain", "🔄");
        CATEGORY_ICONS.put("Cookie Security", "🍪");
        CATEGORY_ICONS.put("Mobile Friendliness", "📱");
        CATEGORY_ICONS.put("Mixed Content & Integrity", "🔒");
        CATEGORY_ICONS.put("Blacklist & Reputation", "🛡️");
        CATEGORY_ICONS.put("Robots & Sitemap", "🤖");
        CATEGORY_ICONS.put("Social Media Preview", "📱");
        CATEGORY_ICONS.put("Image Optimization", "🖼️");
        CATEGORY_ICONS.put("Uptime & Speed", "⏱️");
        CATEGORY_ICONS.put("Legal & Compliance", "⚖️");
        CATEGORY_ICONS.put("Structured Data", "🗺️");
        CATEGORY_ICONS.put("Broken Images", "🧩");
    }

    public interface OnCategoryClickListener {
        void onCategoryClick(AnalysisResponse.Category category);
    }

    public CategoryAdapter(List<AnalysisResponse.Category> categories, OnCategoryClickListener listener) {
        this.listener = listener;
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
        holder.bind(category, listener);
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

        public void bind(AnalysisResponse.Category category, OnCategoryClickListener listener) {
            // ── Category name with icon ──
            String icon = CATEGORY_ICONS.getOrDefault(category.getName(), "📋");
            tvCategoryName.setText(icon + "  " + category.getName());

            // ── Score display ──
            Integer score = category.getScore();
            int issueCount = category.getIssues() != null ? category.getIssues().size() : 0;

            if (score != null) {
                tvScoreCenter.setText(String.valueOf(score));
                circularProgress.setProgress((float) score);
                int color = getScoreColor(score);
                circularProgress.setProgressBarColor(color);
            } else {
                if (issueCount == 0) {
                    tvScoreCenter.setText("✓");
                    circularProgress.setProgress(100f);
                    circularProgress.setProgressBarColor(
                            ContextCompat.getColor(itemView.getContext(), R.color.vibrant_success));
                } else {
                    tvScoreCenter.setText(String.valueOf(issueCount));
                    circularProgress.setProgress(Math.max(0, 100 - issueCount * 15));
                    circularProgress.setProgressBarColor(
                            ContextCompat.getColor(itemView.getContext(), R.color.vibrant_critical));
                }
            }

            // ── Issue count label ──
            if (issueCount > 0) {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText(issueCount + " issue" + (issueCount > 1 ? "s" : "") + " found");
                tvIssueCount.setTextColor(ContextCompat.getColor(itemView.getContext(), R.color.text_premium_secondary));

                // Badge
                if (issueCount >= 5) {
                    tvBadge.setVisibility(View.VISIBLE);
                    tvBadge.setText("HIGH");
                    tvBadge.setBackgroundResource(R.drawable.bg_badge_high);
                } else if (issueCount >= 2) {
                    tvBadge.setVisibility(View.VISIBLE);
                    tvBadge.setText("MED");
                    tvBadge.setBackgroundResource(R.drawable.bg_badge_medium);
                } else {
                    tvBadge.setVisibility(View.GONE);
                }
            } else {
                tvIssueCount.setVisibility(View.VISIBLE);
                tvIssueCount.setText("✓ All clear");
                tvIssueCount.setTextColor(ContextCompat.getColor(itemView.getContext(), R.color.vibrant_success));
                tvBadge.setVisibility(View.GONE);
            }

            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onCategoryClick(category);
                }
            });
        }

        private int getScoreColor(int score) {
            if (score >= 90) return ContextCompat.getColor(itemView.getContext(), R.color.progress_excellent);
            if (score >= 70) return ContextCompat.getColor(itemView.getContext(), R.color.progress_good);
            if (score >= 50) return ContextCompat.getColor(itemView.getContext(), R.color.progress_fair);
            return ContextCompat.getColor(itemView.getContext(), R.color.progress_poor);
        }
    }
}
