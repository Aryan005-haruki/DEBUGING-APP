package com.healthchecker;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import com.google.android.material.bottomnavigation.BottomNavigationView;
import com.healthchecker.ui.fragments.HomeFragment;
import com.healthchecker.ui.fragments.ReportFragment;
import com.healthchecker.ui.fragments.IssuesFragment;
import com.healthchecker.ui.fragments.HistoryFragment;
import com.healthchecker.ui.fragments.SettingsFragment;

public class MainActivity extends AppCompatActivity {

    private BottomNavigationView bottomNav;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        bottomNav = findViewById(R.id.bottomNav);

        // Load default fragment
        if (savedInstanceState == null) {
            loadFragment(new HomeFragment());
        }

        // Bottom navigation click handler
        bottomNav.setOnItemSelectedListener(item -> {
            Fragment selectedFragment = null;

            int itemId = item.getItemId();
            if (itemId == R.id.nav_home) {
                selectedFragment = new HomeFragment();
            } else if (itemId == R.id.nav_reports) {
                selectedFragment = new ReportFragment();
            } else if (itemId == R.id.nav_issues) {
                selectedFragment = new IssuesFragment();
            } else if (itemId == R.id.nav_history) {
                selectedFragment = new HistoryFragment();
            } else if (itemId == R.id.nav_settings) {
                selectedFragment = new SettingsFragment();
            }

            if (selectedFragment != null) {
                loadFragment(selectedFragment);
                return true;
            }
            return false;
        });
    }

    private void loadFragment(Fragment fragment) {
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.fragment_container, fragment)
                .commit();
    }
}
