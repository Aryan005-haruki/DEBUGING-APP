package com.healthchecker.ui.disclaimer;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.healthchecker.R;
import com.healthchecker.ui.home.HomeActivity;
import com.healthchecker.utils.Constants;

public class DisclaimerActivity extends AppCompatActivity {
    private CheckBox checkboxAgree;
    private Button btnAccept;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_disclaimer);

        checkboxAgree = findViewById(R.id.checkboxAgree);
        btnAccept = findViewById(R.id.btnAccept);

        btnAccept.setOnClickListener(v -> {
            if (checkboxAgree.isChecked()) {
                // Save disclaimer acceptance
                SharedPreferences prefs = getSharedPreferences(Constants.PREFS_NAME, MODE_PRIVATE);
                prefs.edit().putBoolean(Constants.PREF_DISCLAIMER_ACCEPTED, true).apply();

                // Navigate to home
                Intent intent = new Intent(DisclaimerActivity.this, HomeActivity.class);
                startActivity(intent);
                finish();
            } else {
                Toast.makeText(this, "Please agree to the terms to continue", Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onBackPressed() {
        // Prevent going back, must accept disclaimer
        finishAffinity();
    }
}
