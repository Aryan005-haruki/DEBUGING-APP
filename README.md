# Health Checker - App & Website Analysis Tool

A FREE MVP tool for analyzing websites and Android apps, providing health reports with actionable fix suggestions.

## 🎯 Features

### Website Analysis
- **Performance**: PageSpeed Insights metrics, Core Web Vitals
- **SEO**: Meta tags, headings, sitemap analysis
- **Accessibility**: WCAG compliance checking
- **Security**: HTTPS verification, security headers
- **Broken Links**: Site-wide link validation

### APK Analysis
- **Size Analysis**: APK size recommendations and optimization tips
- **Permissions**: Review and privacy analysis
- **SDK Versions**: minSdk and targetSdk compliance checking
- **Deprecated APIs**: Detection of outdated Android APIs

### Results
- Issues categorized as: **Critical**, **Warning**, **Passed**
- Each issue includes:
  - Clear description
  - Impact assessment
  - Step-by-step fix suggestions
  - Resource links for learning

## 🏗️ Architecture

### Backend (Node.js + Express)
```
backend/
├── src/
│   ├── config/         # Configuration
│   ├── controllers/    # Request handlers
│   ├── services/       # Analysis logic
│   ├── utils/          # Fix suggestions database
│   └── routes/         # API routes
├── package.json
└── .env
```

**Key Services:**
- `pagespeedService.js` - Google PageSpeed Insights API
- `apkAnalysisService.js` - APK static analysis
- `linkCheckerService.js` - Broken link detection
- `reportGeneratorService.js` - Issue classification & reporting

### Android App (Java, MVVM, Material 3)
```
app/src/main/java/com/healthchecker/
├── data/
│   ├── api/            # Retrofit API interface
│   ├── models/         # Data models
│   └── repository/     # Repository pattern
├── ui/
│   ├── home/           # Home screen
│   ├── input/          # URL/APK input screens
│   ├── loading/        # Loading screen
│   ├── report/         # Report display
│   ├── fixsuggestion/  # Fix details
│   └── disclaimer/     # Terms & disclaimer
└── utils/              # Utilities
```

**Tech Stack:**
- Pure Java (as requested)
- MVVM architecture
- Material 3 (Material You) UI
- Retrofit 2 for API calls
- AndroidX Lifecycle (ViewModel, LiveData)

## 🚀 Setup & Installation

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure Environment**
   
   Edit `.env`:
   ```
   PORT=3000
   GOOGLE_PAGESPEED_API_KEY=AIzaSyBbca85f1pgGUnrmyqNRp4dKdcmhw4tRx4A
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Deploy to Free Hosting** (Railway/Render)
   - Sign up at railway.app or render.com
   - Connect your GitHub repo
   - Add environment variables
   - Deploy

### Android App Setup

1. **Open in Android Studio**
   - Open the project in Android Studio
   - Wait for Gradle sync

2. **Update API URL**
   
   In `Constants.java`, update `BASE_URL`:
   ```java
   // For local testing
   public static final String BASE_URL = "http://10.0.2.2:3000/api/v1/";
   
   // For production
   public static final String BASE_URL = "https://your-api.railway.app/api/v1/";
   ```

3. **Build & Run**
   ```bash
   ./gradlew assembleDebug
   ./gradlew installDebug
   ```

## 📡 API Endpoints

### Analyze Website
```http
POST /api/v1/analyze/website
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Analyze APK
```http
POST /api/v1/analyze/apk
Content-Type: multipart/form-data

file: <APK file>
```

## 📱 App Screens

1. **Disclaimer** - Terms of use and privacy policy
2. **Home** - Choose Website or APK analysis
3. **Input** - Enter URL or upload APK
4. **Loading** - Analysis in progress
5. **Report** - Results with severity filtering
6. **Fix Suggestion** - Detailed fix instructions

## 🔒 Important Disclaimer

- **Educational Use Only**: This tool is for learning and improvement
- **Own Content Only**: Analyze only apps/websites you own or have permission for
- **No Hacking**: No penetration testing or unauthorized access
- **Free Tools Only**: Uses only free or free-tier services

## 🎨 Material 3 Design

The app uses Google's Material 3 (Material You) design system:
- Dynamic color theming
- Elevated cards with rounded corners
- Material buttons and text fields
- Proper typography scale
- Accessibility-first approach

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test
```

Test websites:
- https://web.dev
- https://google.com
- Your own website

### Android Testing
- Test on emulator (API 21+)
- Test on physical device
- Test website analysis flow
- Test APK upload flow (max 50 MB)

## 📦 Production Deployment

### Backend (Railway)
1. Push code to GitHub
2. Connect Railway to your repo
3. Add environment variables
4. Deploy automatically

### Android App
1. Update `BASE_URL` to production API
2. Build release APK:
   ```bash
   ./gradlew assembleRelease
   ```
3. Sign APK with keystore
4. Distribute via Google Play or direct download

## 🛠️ Technologies Used

### Backend
- Node.js 18+
- Express.js
- Google PageSpeed Insights API
- `apk-parser3` for APK analysis
- `broken-link-checker` for link validation
- Multer for file uploads

### Android
- Java 11
- Material 3
- Retrofit 2 & OkHttp
- Gson for JSON parsing
- AndroidX Lifecycle
- ViewBinding

## 🚧 Limitations (Free Tier)

- APK upload: 50 MB max
- Analysis timeout: 2 minutes
- Rate limit: 20 requests per 15 minutes per IP
- Lighthouse may not work on all free hosting (requires Chrome)

## 📄 License

MIT License - Feel free to use for educational purposes

## 🤝 Contributing

This is an MVP project. Contributions welcome for:
- Additional analysis features
- UI improvements
- Bug fixes
- Documentation

---

**Built with ❤️ using FREE tools and services**
