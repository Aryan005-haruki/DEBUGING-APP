# Health Checker Backend API

Backend service for App & Website Health Checker MVP.

## Features

- **Website Analysis**
  - Performance metrics via Google PageSpeed Insights API
  - SEO analysis
  - Accessibility checks
  - Security checks (HTTPS)
  - Broken links detection

- **APK Analysis**
  - APK size analysis
  - Permissions review
  - SDK version checks
  - Deprecated API detection (basic)

## Setup

### Prerequisites
- Node.js 18+ installed
- Google PageSpeed Insights API key

### Installation

```bash
cd backend
npm install
```

### Configuration

Create or edit `.env` file:
```
NODE_ENV=development
PORT=3000
GOOGLE_PAGESPEED_API_KEY=your_api_key_here
MAX_UPLOAD_SIZE=52428800
ALLOWED_ORIGINS=*
```

### Run Development Server

```bash
npm run dev
```

### Run Production Server

```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Analyze Website
```
POST /api/v1/analyze/website
Content-Type: application/json

{
  "url": "https://example.com"
}
```

### Analyze APK
```
POST /api/v1/analyze/apk
Content-Type: multipart/form-data

file: <APK file>
```

## Deployment

### Free Hosting Options

1. **Railway** (Recommended)
   - Sign up at railway.app
   - Connect GitHub repo
   - Add environment variables
   - Deploy

2. **Render**
   - Sign up at render.com
   - Create new Web Service
   - Connect repo
   - Deploy

3. **Vercel** (Serverless)
   - Requires adapting for serverless functions
   - Good for lighter workloads

## Response Format

All responses follow this structure:

```json
{
  "status": "success" | "error",
  "data": { ... },
  "message": "error message if applicable"
}
```

## Rate Limiting

- 20 requests per 15 minutes per IP address
- Prevents abuse and ensures fair usage

## Notes

- APK uploads limited to 50MB
- Website analysis timeout: 2 minutes
- Lighthouse analysis may not work on all free hosting platforms (requires Chrome)
