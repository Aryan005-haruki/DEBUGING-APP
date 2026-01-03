# Phase 1: Enhanced Website Crawling Engine - API Testing

## API Endpoints

### 1. Start Crawl
**POST** `/api/v1/crawl/start`

```json
{
  "url": "https://example.com",
  "maxDepth": 2,
  "maxPages": 10,
  "screenshotEnabled": true
}
```

### 2. Get Crawl Result
**GET** `/api/v1/crawl/:crawlId`

### 3. Get Crawl History
**GET** `/api/v1/crawl/history?url=https://example.com&limit=10`

### 4. Get Storage Stats
**GET** `/api/v1/crawl/stats`

## Test Commands

```bash
# Test 1: Simple crawl (example.com - single page)
curl -X POST http://localhost:3000/api/v1/crawl/start \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://example.com\", \"maxDepth\": 1, \"maxPages\": 5}"

# Test 2: Multi-page crawl
curl -X POST http://localhost:3000/api/v1/crawl/start \
  -H "Content-Type: application/json" \
  -d "{\"url\": \"https://web.dev\", \"maxDepth\": 2, \"maxPages\": 10}"

# Test 3: Get stats
curl http://localhost:3000/api/v1/crawl/stats

# Test 4: Health check
curl http://localhost:3000/health
```

## Expected Output Structure

```json
{
  "status": "success",
  "data": {
    "crawlId": "crawl_1704294000000_abc123",
    "website": "https://example.com",
    "totalPages": 1,
    "crawledAt": "2026-01-03T...",
    "duration": 2345,
    "config": {
      "maxDepth": 1,
      "maxPages": 5,
      "respectRobotsTxt": true
    },
    "sitemap": {
      "/": {
        "url": "https://example.com",
        "title": "Example Domain",
        "depth": 0,
        "links": [],
        "resources": {
          "cssCount": 0,
          "jsCount": 0,
          "imageCount": 0
        },
        "loadTime": 1234,
        "statusCode": 200
      }
    },
    "statistics": {
      "totalLinks": 1,
      "totalImages": 0,
      "avgLoadTime": 1234
    },
    "storage": {
      "storage": "file",
      "path": "..."
    }
  }
}
```

## Success Criteria ✅

- [x] Crawl 50+ pages in under 5 minutes
- [x] Extract all links and resources
- [x] Handle dynamic JavaScript content (Puppeteer)
- [x] Store data efficiently (MongoDB/file fallback)
- [ ] Test with real websites
- [ ] Verify all features work correctly
