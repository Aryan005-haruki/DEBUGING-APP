# Running with Docker 🐳

Using Docker allows you to run the backend in a consistent environment without worrying about installing Node.js or other dependencies manually.

## Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

## How to Start

### 1. Using Docker Compose (Recommended)
This will start both the Backend API and a MongoDB instance automatically.

```bash
cd backend
docker-compose up --build
```

The API will be available at `http://localhost:3000`.

### 2. Using only Dockerfile
If you only want to run the backend without MongoDB:

```bash
cd backend
docker build -t health-checker-backend .
docker run -p 3000:3000 health-checker-backend
```

## Remote Testing (Testing from different networks)
If your phone and laptop are on **different networks** (e.g., phone on mobile data), `localhost` or local IPs will not work. You need to expose your local server to the internet.

### Option A: Using Localtunnel (Fast & Free)
1.  Run your Docker container as usual.
2.  In a new terminal on your PC, run:
    ```bash
    npx localtunnel --port 3000
    ```
3.  Copy the URL provided (e.g., `https://short-zebra-run.loca.lt`).
4.  Update `Constants.java` in the Android app:
    ```java
    public static final String BASE_URL = "https://short-zebra-run.loca.lt/api/v1/";
    ```

### Option B: Using Ngrok
1.  Install [Ngrok](https://ngrok.com/).
2.  Run: `ngrok http 3000`.
3.  Use the Forwarding URL in `Constants.java`.

## Android App Configuration
| Setup | `BASE_URL` in `Constants.java` |
| :--- | :--- |
| **Emulator** | `http://10.0.2.2:3000/api/v1/` |
| **Same WiFi** | `http://192.168.x.x:3000/api/v1/` (Use PC IP) |
| **Different Networks** | Use Localtunnel/Ngrok URL |

## Why use Docker?
1.  **Consistency**: No more "it works on my machine" issues.
2.  **Puppeteer Support**: The Dockerfile automatically installs all necessary Linux libraries for Puppeteer (website analysis) to work correctly.
3.  **Isolation**: Keep your development environment clean.
