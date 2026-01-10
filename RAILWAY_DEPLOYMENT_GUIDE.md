# 🚀 Railway Deployment Guide - Step by Step

Backend ko Railway par deploy karne ka **complete guide** with screenshots aur exact steps.

---

## ✅ Prerequisites (Pehle Ye Check Karo)

- [ ] GitHub account (railway.app ke liye)
- [ ] Internet connection
- [ ] Backend code ready (already hai ✅)

---

## 📋 Step-by-Step Deployment

### Step 1: GitHub Account Setup (Agar Nahi Hai)

1. **GitHub par jao**: https://github.com
2. **Sign Up** karo (if don't have account)
3. Email verify karo
4. **Done!** ✅

---

### Step 2: Code Ko GitHub Par Push Karo

#### Option A: Using GitHub Desktop (Easiest for Beginners)

1. **Download GitHub Desktop**: https://desktop.github.com
2. Install karo
3. GitHub Desktop kholo
4. **File → Add Local Repository**
5. Browse karke select karo: `d:\aryan project\debug app`
6. **Create Repository**:
   - Name: `health-checker-app`
   - Description: "Website and App Health Checker"
   - Click **"Create Repository"**
7. **Publish Repository**:
   - Click **"Publish repository"** button
   - Uncheck **"Keep this code private"** (ya checked rakho, koi fark nahi)
   - Click **"Publish repository"**
8. **Done!** Code ab GitHub par hai ✅

#### Option B: Using Git Commands (Advanced)

```bash
# Terminal mein ye commands run karo
cd "d:\aryan project\debug app"

# Git initialize (agar pehle se nahi hai)
git init

# Files add karo
git add .

# Commit karo
git commit -m "Initial commit - Health Checker App"

# GitHub par naya repo banao (browser mein):
# https://github.com/new
# Repo name: health-checker-app

# Remote add karo (apna username daalo)
git remote add origin https://github.com/YOUR_USERNAME/health-checker-app.git

# Push karo
git branch -M main
git push -u origin main
```

---

### Step 3: Railway Account Banao

1. **Railway.app kholo**: https://railway.app
2. **"Login"** button par click karo (top-right)
3. **"Login with GitHub"** select karo
4. GitHub se authorize karo
5. Email verify karo (check inbox)
6. **Dashboard khul jayega** ✅

---

### Step 4: Railway Par Backend Deploy Karo

#### 4.1 New Project Banao

1. Railway Dashboard mein **"New Project"** button click karo
2. **"Deploy from GitHub repo"** select karo
3. **Configure GitHub App** (first time):
   - Click **"Configure GitHub App"**
   - Select **"Only select repositories"**
   - Choose: `health-checker-app`
   - Click **"Install & Authorize"**

#### 4.2 Repository Select Karo

1. Search box mein type karo: `health-checker-app`
2. Repository **"health-checker-app"** par click karo
3. Railway automatically detect karega Node.js project ✅

#### 4.3 Backend Folder Select Karo (IMPORTANT!)

**Problem**: Tumhara repo mein `backend` folder hai, to specify karna padega

1. Project create hone ke baad, service settings mein jao
2. **"Settings"** tab click karo
3. **"Root Directory"** field mein likho: `backend`
4. **"Save"** karo

#### 4.4 Environment Variables Add Karo

1. **"Variables"** tab par click karo
2. **"New Variable"** button click karo
3. Ye variables add karo:

**Variable 1:**
- **Key**: `PORT`
- **Value**: `3000`
- Click **"Add"**

**Variable 2:**
- **Key**: `GOOGLE_PAGESPEED_API_KEY`
- **Value**: `AIzaSyBbca85f1pgGUnrmyqNRp4dKdcmhw4tRx4A`
- Click **"Add"**

**Variable 3:**
- **Key**: `NODE_ENV`
- **Value**: `production`
- Click **"Add"**

4. **Save** karo

#### 4.5 Deploy Karo!

1. **"Deployments"** tab par jao
2. Railway automatically deploy start kar dega
3. **Wait karo 2-3 minutes** (build ho raha hai)
4. Green ✅ dikhega jab deploy ho jayega

---

### Step 5: Public URL Generate Karo

1. **"Settings"** tab mein jao
2. **"Networking"** section dhundo
3. **"Generate Domain"** button click karo
4. Railway ek URL dega jaise:
   ```
   https://health-checker-backend-production.up.railway.app
   ```
5. **Copy karo ye URL** 📋 (bahut important!)

---

### Step 6: Test Karo Deployed Backend

1. **Browser mein ye URL kholo**:
   ```
   https://your-app-name.up.railway.app/health
   ```
   (apna actual URL use karo)

2. **Ye response dikhna chahiye**:
   ```json
   {
     "status": "OK",
     "timestamp": "2026-01-10T10:18:00.000Z"
   }
   ```

3. Agar ye dikh raha hai = **Backend successfully deployed!** 🎉

---

### Step 7: App Mein URL Update Karo

1. **Android Studio** mein project kholo
2. **Constants.java** file kholo:
   ```
   app/src/main/java/com/healthchecker/utils/Constants.java
   ```

3. **Line 13 edit karo**:

   **Purana (local):**
   ```java
   public static final String BASE_URL = "http://192.168.0.103:3000/api/v1/";
   ```

   **Naya (deployed):**
   ```java
   public static final String BASE_URL = "https://your-app-name.up.railway.app/api/v1/";
   ```
   
   ⚠️ **IMPORTANT**: 
   - Apna actual Railway URL use karo
   - End mein `/api/v1/` zaroor add karo
   - `https://` use karo (not `http://`)

4. **Save** karo (Ctrl + S)

---

### Step 8: App Rebuild Karo

1. **Android Studio** mein:
   - **Build → Clean Project**
   - Wait karo...
   - **Build → Rebuild Project**
   - Wait karo build complete hone tak

2. **App run karo**:
   - Device/Emulator select karo
   - **Run** button (green play icon) click karo

---

### Step 9: Test Karo (Final Check!)

#### Test 1: Same WiFi Par
1. App kholo
2. Website URL daalo: `https://google.com`
3. **"Start Deep Scan"** click karo
4. Analysis complete hona chahiye ✅

#### Test 2: Different Network Par (Real Test!)
1. **Phone ka WiFi OFF karo**
2. **Mobile Data ON karo**
3. App kholo
4. Website URL daalo
5. **Scan karo**
6. **Kaam karna chahiye!** 🎉

Agar dono test pass ho gaye = **App ab anywhere se kaam karega!** 🌍

---

## 🎯 Summary - Kya Kiya Humne

✅ **Backend ko cloud par deploy kiya** (Railway)  
✅ **Public URL mila** (internet se accessible)  
✅ **App mein URL update kiya**  
✅ **App rebuild kiya**  
✅ **Test kiya different networks par**  

**Result**: Ab app kahi se bhi kaam karega - same network ki zarurat nahi! 🚀

---

## 💡 Tips & Troubleshooting

### Tip 1: Free Tier Limits
- Railway free tier: $5 credit per month
- Backend always on (no sleep)
- Enough for testing/hobby projects

### Tip 2: Check Deployment Logs
Agar error aaye:
1. Railway dashboard → **"Deployments"**
2. Failed deployment click karo
3. **"View Logs"** dekho error ke liye

### Tip 3: Update Code
Jab bhi backend code update karo:
1. GitHub par push karo
2. Railway automatically re-deploy karega

### Common Issues:

**Problem**: App says "Connection Failed"
**Solution**: 
- Check URL `Constants.java` mein sahi hai
- `/api/v1/` end mein hai
- `https://` use kiya hai (not `http://`)

**Problem**: Railway build fail
**Solution**:
- Check **"Root Directory"** = `backend`
- Environment variables sahi add kiye

**Problem**: Railway shows 404
**Solution**:
- Try: `https://your-url/health`
- Agar ye kaam karta hai to backend running hai
- Check API route: `/api/v1/analyze/website`

---

## 📞 Need Help?

Agar koi step mein problem aaye to batao, main help karunga! 👍
