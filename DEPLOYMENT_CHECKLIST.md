# 🚀 Railway Deployment - Quick Checklist

## ✅ Backend Ready for Deployment
- [x] Backend code structured properly
- [x] `railway.json` configuration file present
- [x] `package.json` has correct start script
- [x] `.gitignore` configured (protects `.env`)
- [x] Environment variables will be set in Railway
- [x] Code already on GitHub (main branch)

## 📋 Deployment Steps (Follow RAILWAY_DEPLOYMENT_GUIDE.md)

### Step 1: Railway Setup
- [ ] Create Railway account (https://railway.app)
- [ ] Login with GitHub

### Step 2: Deploy Backend
- [ ] Create new project in Railway
- [ ] Select GitHub repository: `health-checker-app`
- [ ] Set Root Directory to: `backend`
- [ ] Add environment variables:
  - `PORT` = `3000`
  - `GOOGLE_PAGESPEED_API_KEY` = `AIzaSyBbca85f1pgGUnrmyqNRp4dKdcmhw4tRx4A`
  - `NODE_ENV` = `production`
- [ ] Generate public domain (Settings → Networking)
- [ ] Wait for deployment (2-3 minutes)

### Step 3: Test Backend
- [ ] Open: `https://your-app.railway.app/health`
- [ ] Should return: `{"status": "OK", ...}`

### Step 4: Update Android App
- [ ] Open `Constants.java` in Android Studio
- [ ] Update `BASE_URL` with Railway URL
- [ ] Build → Clean Project
- [ ] Build → Rebuild Project

### Step 5: Test App
- [ ] Test on same WiFi
- [ ] Test on mobile data (different network)
- [ ] ✅ App works from anywhere!

## 🎯 Your Railway URL Template
After deployment, your URL will look like:
```
https://health-checker-backend-production.up.railway.app
```

Update `Constants.java` to:
```java
public static final String BASE_URL = "https://your-actual-url.up.railway.app/api/v1/";
```

## 📖 Detailed Guide
See: `RAILWAY_DEPLOYMENT_GUIDE.md` for complete step-by-step instructions
