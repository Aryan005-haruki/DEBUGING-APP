package com.healthchecker.utils;

import android.content.Context;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;
import com.google.android.material.card.MaterialCardView;
import com.healthchecker.R;

/**
 * PHASE 2: Security Warning Helper
 * Utility class to display security warnings and scores
 */
public class SecurityWarningHelper {

    private final Context context;

    public SecurityWarningHelper(Context context) {
        this.context = context;
    }

    /**
     * Display security warning banner based on score
     * 
     * @param bannerView    The security warning banner view
     * @param score         Security score (0-100)
     * @param grade         Security grade (A-F)
     * @param criticalCount Number of critical issues
     * @param warningCount  Number of warning issues
     */
    public void displaySecurityWarning(View bannerView, int score, String grade,
            int criticalCount, int warningCount) {
        if (bannerView == null)
            return;

        // Determine if warning should be shown
        if (score >= 90) {
            // Excellent security - hide warning
            bannerView.setVisibility(View.GONE);
            return;
        }

        // Show warning banner
        bannerView.setVisibility(View.VISIBLE);

        MaterialCardView card = (MaterialCardView) bannerView;
        TextView tvWarningTitle = bannerView.findViewById(R.id.tvWarningTitle);
        TextView tvWarningMessage = bannerView.findViewById(R.id.tvWarningMessage);
        TextView tvSecurityScore = bannerView.findViewById(R.id.tvSecurityScore);
        TextView tvSecurityGrade = bannerView.findViewById(R.id.tvSecurityGrade);
        TextView tvCriticalCount = bannerView.findViewById(R.id.tvCriticalCount);
        TextView tvWarningCount = bannerView.findViewById(R.id.tvWarningCount);
        ProgressBar scoreProgress = bannerView.findViewById(R.id.securityScoreProgress);

        // Set score and grade
        tvSecurityScore.setText(score + "%");
        tvSecurityGrade.setText(grade);
        scoreProgress.setProgress(score);

        // Set issue counts
        tvCriticalCount.setText(context.getString(R.string.critical_issues_count, criticalCount));
        tvWarningCount.setText(context.getString(R.string.warning_issues_count, warningCount));

        // Configure based on security level
        int backgroundColor, strokeColor, textColor, progressColor;
        String title, message;

        if (score < 50) {
            // Critical (F grade)
            title = context.getString(R.string.security_warning);
            message = String.format(context.getString(R.string.security_critical_warning), score, grade);
            backgroundColor = ContextCompat.getColor(context, R.color.security_critical_bg);
            strokeColor = ContextCompat.getColor(context, R.color.critical_red);
            textColor = ContextCompat.getColor(context, R.color.critical_red);
            progressColor = ContextCompat.getColor(context, R.color.security_critical);
        } else if (score < 70) {
            // Poor (D grade)
            title = "⚠️ Security Issues Detected";
            message = String.format(context.getString(R.string.security_needs_improvement), score, grade);
            backgroundColor = ContextCompat.getColor(context, R.color.security_warning_bg);
            strokeColor = ContextCompat.getColor(context, R.color.warning_orange);
            textColor = ContextCompat.getColor(context, R.color.warning_orange);
            progressColor = ContextCompat.getColor(context, R.color.security_poor);
        } else {
            // Fair (C grade)
            title = "⚠️ Security Needs Improvement";
            message = String.format(context.getString(R.string.security_needs_improvement), score, grade);
            backgroundColor = ContextCompat.getColor(context, R.color.warning_bg);
            strokeColor = ContextCompat.getColor(context, R.color.warning_orange);
            textColor = ContextCompat.getColor(context, R.color.md_theme_light_onSurface);
            progressColor = ContextCompat.getColor(context, R.color.security_fair);
        }

        // Apply styling
        card.setCardBackgroundColor(backgroundColor);
        card.setStrokeColor(strokeColor);
        tvWarningTitle.setText(title);
        tvWarningTitle.setTextColor(textColor);
        tvWarningMessage.setText(message);

        // Update progress bar color dynamically
        scoreProgress.getProgressDrawable().setColorFilter(progressColor,
                android.graphics.PorterDuff.Mode.SRC_IN);
    }

    /**
     * Get color for security score
     * 
     * @param score Security score (0-100)
     * @return Color resource ID
     */
    public int getScoreColor(int score) {
        if (score >= 90) {
            return R.color.security_excellent; // A - Green
        } else if (score >= 80) {
            return R.color.security_good; // B - Lime Green
        } else if (score >= 70) {
            return R.color.security_fair; // C - Orange
        } else if (score >= 50) {
            return R.color.security_poor; // D - Orange Red
        } else {
            return R.color.security_critical; // F - Crimson Red
        }
    }

    /**
     * Get grade letter from score
     * 
     * @param score Security score (0-100)
     * @return Grade letter (A-F)
     */
    public static String getGrade(int score) {
        if (score >= 90)
            return "A";
        else if (score >= 80)
            return "B";
        else if (score >= 70)
            return "C";
        else if (score >= 50)
            return "D";
        else
            return "F";
    }
}
