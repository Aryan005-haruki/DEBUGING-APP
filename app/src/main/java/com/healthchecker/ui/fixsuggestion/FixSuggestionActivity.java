package com.healthchecker.ui.fixsuggestion;

import android.graphics.Color;
import android.os.Bundle;
import android.text.SpannableString;
import android.text.Spanned;
import android.text.style.ForegroundColorSpan;
import android.view.Gravity;
import android.view.View;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;

import com.healthchecker.R;
import com.healthchecker.data.models.FixSuggestion;
import com.healthchecker.data.models.Issue;
import com.healthchecker.utils.Constants;

import java.util.List;

public class FixSuggestionActivity extends AppCompatActivity {

    private TextView tvIssueTitle, tvIssueDescription, tvIssueImpact;
    private TextView tvFixSummary, tvFixSteps, tvResources, tvSeverityBadge, tvCategoryChip;
    private TextView tvLocationPage, tvLocationElement, tvLocationSelector, tvLocationHint;
    private LinearLayout headerBanner, rowLocationPage, rowLocationElement,
            rowLocationSelector, rowLocationHint, breadcrumbContainer;
    private ImageView ivSeverityIcon;
    private View cardLocation, cardResources;
    private int severityColor;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_fix_suggestion);

        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle("Issue Details");
        }

        initViews();
        loadIssueData();
    }

    private void initViews() {
        headerBanner       = findViewById(R.id.headerBanner);
        tvSeverityBadge    = findViewById(R.id.tvSeverityBadge);
        ivSeverityIcon     = findViewById(R.id.ivSeverityIcon);
        tvIssueTitle       = findViewById(R.id.tvIssueTitle);
        tvCategoryChip     = findViewById(R.id.tvCategoryChip);

        breadcrumbContainer = findViewById(R.id.breadcrumbContainer);

        // Location
        cardLocation          = findViewById(R.id.cardLocation);
        tvLocationPage        = findViewById(R.id.tvLocationPage);
        tvLocationElement     = findViewById(R.id.tvLocationElement);
        tvLocationSelector    = findViewById(R.id.tvLocationSelector);
        tvLocationHint        = findViewById(R.id.tvLocationHint);
        rowLocationPage       = findViewById(R.id.rowLocationPage);
        rowLocationElement    = findViewById(R.id.rowLocationElement);
        rowLocationSelector   = findViewById(R.id.rowLocationSelector);
        rowLocationHint       = findViewById(R.id.rowLocationHint);

        // Details
        tvIssueDescription    = findViewById(R.id.tvIssueDescription);
        tvIssueImpact         = findViewById(R.id.tvIssueImpact);

        // Fix
        tvFixSummary          = findViewById(R.id.tvFixSummary);
        tvFixSteps            = findViewById(R.id.tvFixSteps);

        // Resources
        cardResources         = findViewById(R.id.cardResources);
        tvResources           = findViewById(R.id.tvResources);
    }

    private void loadIssueData() {
        Issue issue = (Issue) getIntent().getSerializableExtra(Constants.EXTRA_ISSUE_DATA);
        if (issue == null) return;

        // ── Severity styling ──
        applySeverityStyling(issue);

        // ── Location ──
        bindLocation(issue.getLocation());

        // ── What is this issue ──
        tvIssueDescription.setText(notEmpty(issue.getDescription(), "No description available."));
        tvIssueImpact.setText(notEmpty(issue.getImpact(), "Unknown impact."));

        // ── How to fix ──
        FixSuggestion fix = issue.getFixSuggestion();
        if (fix != null) {
            tvFixSummary.setText(notEmpty(fix.getSummary(), ""));

            List<String> steps = fix.getSteps();
            if (steps != null && !steps.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < steps.size(); i++) {
                    sb.append((i + 1)).append(".  ").append(steps.get(i)).append("\n\n");
                }
                tvFixSteps.setText(sb.toString().trim());
            } else {
                tvFixSteps.setText("No steps available.");
            }

            List<String> resources = fix.getResources();
            if (resources != null && !resources.isEmpty()) {
                StringBuilder rb = new StringBuilder();
                for (String r : resources) {
                    rb.append("• ").append(r).append("\n");
                }
                tvResources.setText(rb.toString().trim());
                cardResources.setVisibility(View.VISIBLE);
            } else {
                cardResources.setVisibility(View.GONE);
            }
        } else {
            tvFixSummary.setText("No fix suggestion available.");
            tvFixSteps.setText("");
            cardResources.setVisibility(View.GONE);
        }
    }

    private void applySeverityStyling(Issue issue) {
        String severity = issue.getSeverity() != null ? issue.getSeverity().toUpperCase() : "INFO";
        tvIssueTitle.setText(issue.getTitle());
        tvSeverityBadge.setText(severity);

        int bannerColor, iconColor, badgeColor;
        if (issue.isCritical()) {
            bannerColor = getColor(R.color.critical_bg);
            iconColor   = getColor(R.color.critical_red);
            badgeColor  = getColor(R.color.critical_red);
        } else if (issue.isWarning()) {
            bannerColor = 0xFFFFF8E1;   // amber light
            iconColor   = getColor(R.color.warning_orange);
            badgeColor  = getColor(R.color.warning_orange);
        } else {
            bannerColor = 0xFFE3F2FD;   // blue light
            iconColor   = getColor(R.color.md_theme_light_primary);
            badgeColor  = getColor(R.color.md_theme_light_primary);
        }

        headerBanner.setBackgroundColor(bannerColor);
        ivSeverityIcon.setColorFilter(iconColor);
        tvSeverityBadge.setTextColor(badgeColor);
        severityColor = iconColor;

        // Category chip
        String categoryText = "Severity: " + severity;
        tvCategoryChip.setText(categoryText);
    }

    private void bindLocation(Issue.Location loc) {
        if (loc == null || !loc.hasLocation()) {
            cardLocation.setVisibility(View.GONE);
            return;
        }
        cardLocation.setVisibility(View.VISIBLE);

        // Breadcrumb path
        renderBreadcrumb(loc.getPath());

        setRow(rowLocationPage,     tvLocationPage,     loc.getPage());
        setRow(rowLocationElement,  tvLocationElement,  loc.getElement());
        setRow(rowLocationSelector, tvLocationSelector, loc.getSelector());
        setRow(rowLocationHint,     tvLocationHint,     loc.getLineHint());
    }

    private void renderBreadcrumb(List<String> path) {
        breadcrumbContainer.removeAllViews();
        if (path == null || path.isEmpty()) {
            breadcrumbContainer.setVisibility(View.GONE);
            return;
        }
        breadcrumbContainer.setVisibility(View.VISIBLE);

        int textColor        = getColor(R.color.md_theme_light_onSurfaceVariant);
        int separatorColor   = getColor(R.color.md_theme_light_onSurfaceVariant);
        int errorColor       = (severityColor != 0) ? severityColor : getColor(R.color.critical_red);

        for (int i = 0; i < path.size(); i++) {
            boolean isLast = (i == path.size() - 1);

            // Chip textview
            TextView chip = new TextView(this);
            chip.setText(path.get(i));
            chip.setTextSize(13f);
            chip.setTextColor(isLast ? errorColor : textColor);
            chip.setTypeface(null, isLast ? android.graphics.Typeface.BOLD : android.graphics.Typeface.NORMAL);
            chip.setPadding(0, 0, 0, 0);

            // Build background pill for last item
            if (isLast) {
                android.graphics.drawable.GradientDrawable bg = new android.graphics.drawable.GradientDrawable();
                bg.setShape(android.graphics.drawable.GradientDrawable.RECTANGLE);
                bg.setCornerRadius(20f);
                // Set a light version of severityColor as background
                int alpha = (errorColor & 0xFF000000) | 0x22000000;
                bg.setColor((errorColor & 0x00FFFFFF) | 0x22000000);
                chip.setBackground(bg);
                chip.setPadding(16, 4, 16, 4);
            }

            breadcrumbContainer.addView(chip);

            // Add separator ' > ' between chips
            if (!isLast) {
                TextView sep = new TextView(this);
                sep.setText("  ›  ");
                sep.setTextSize(14f);
                sep.setTextColor(separatorColor);
                breadcrumbContainer.addView(sep);
            }
        }
    }

    private void setRow(View row, TextView tv, String value) {
        if (value != null && !value.isEmpty()) {
            tv.setText(value);
            row.setVisibility(View.VISIBLE);
        } else {
            row.setVisibility(View.GONE);
        }
    }

    private String notEmpty(String s, String fallback) {
        return (s != null && !s.trim().isEmpty()) ? s.trim() : fallback;
    }

    @Override
    public boolean onSupportNavigateUp() {
        onBackPressed();
        return true;
    }
}
