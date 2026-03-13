package com.healthchecker.ui.fragments;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.fragment.app.Fragment;

import com.google.android.material.materialswitch.MaterialSwitch;
import com.healthchecker.R;

public class SettingsFragment extends Fragment {

    private SharedPreferences sharedPreferences;
    private static final String PREF_DARK_MODE = "dark_mode";

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
            @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.fragment_settings, container, false);

        sharedPreferences = requireActivity().getSharedPreferences("Settings", Context.MODE_PRIVATE);

        MaterialSwitch switchDarkMode = view.findViewById(R.id.switchSettings);
        if (switchDarkMode != null) {
            // Load current state
            boolean isDarkMode = sharedPreferences.getBoolean(PREF_DARK_MODE, false);
            switchDarkMode.setChecked(isDarkMode);

            // Toggle listener
            switchDarkMode.setOnCheckedChangeListener((buttonView, isChecked) -> {
                sharedPreferences.edit().putBoolean(PREF_DARK_MODE, isChecked).apply();
                
                if (isChecked) {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
                    Toast.makeText(getContext(), "Dark Mode Enabled", Toast.LENGTH_SHORT).show();
                } else {
                    AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
                    Toast.makeText(getContext(), "Dark Mode Disabled", Toast.LENGTH_SHORT).show();
                }
            });
        }

        return view;
    }
}
