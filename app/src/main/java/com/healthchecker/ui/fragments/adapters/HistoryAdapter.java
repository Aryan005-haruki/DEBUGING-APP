package com.healthchecker.ui.fragments.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.healthchecker.R;
import com.healthchecker.data.local.ScanReportEntity;
import com.healthchecker.utils.FileUtils;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

public class HistoryAdapter extends RecyclerView.Adapter<HistoryAdapter.ViewHolder> {
    private List<ScanReportEntity> reports = new ArrayList<>();
    private final OnItemClickListener listener;

    public interface OnItemClickListener {
        void onItemClick(ScanReportEntity report);
    }

    public HistoryAdapter(OnItemClickListener listener) {
        this.listener = listener;
    }

    public void setReports(List<ScanReportEntity> reports) {
        this.reports = reports;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_history, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        ScanReportEntity report = reports.get(position);
        holder.bind(report, listener);
    }

    @Override
    public int getItemCount() {
        return reports.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView tvTarget, tvType, tvDate, tvScore, tvIssues;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvTarget = itemView.findViewById(R.id.tvTarget);
            tvType = itemView.findViewById(R.id.tvType);
            tvDate = itemView.findViewById(R.id.tvDate);
            tvScore = itemView.findViewById(R.id.tvScore);
            tvIssues = itemView.findViewById(R.id.tvIssues);
        }

        public void bind(ScanReportEntity report, OnItemClickListener listener) {
            tvTarget.setText(report.getTarget());
            tvType.setText(report.getType());
            
            SimpleDateFormat sdf = new SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault());
            tvDate.setText(sdf.format(new Date(report.getTimestamp())));
            
            tvScore.setText(report.getScore() + "%");
            tvIssues.setText(report.getCriticalCount() + " Critical, " + report.getWarningCount() + " Warning");

            // Type specific styling
            if ("WEBSITE".equalsIgnoreCase(report.getType())) {
                tvType.setTextColor(itemView.getContext().getColor(R.color.premium_primary));
            } else {
                tvType.setTextColor(itemView.getContext().getColor(R.color.premium_accent));
            }

            itemView.setOnClickListener(v -> listener.onItemClick(report));
        }
    }
}
