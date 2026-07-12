# KhanCare AI — Complete Deployment Guide (Docker → AWS / Render)

> This guide teaches you every step with **why** we do it.

---

## Table of Contents

1. [Understanding the Architecture](#1-understanding-the-architecture)
2. [Pre-Deployment Fixes](#2-pre-deployment-fixes)
3. [Docker — What & Why](#3-docker--what--why)
4. [Creating Dockerfiles](#4-creating-dockerfiles)
5. [Docker Compose — Local Testing](#5-docker-compose--local-testing)
6. [Deploy to Render (Easiest)](#6-deploy-to-render)
7. [Deploy to AWS (Production)](#7-deploy-to-aws)
8. [Environment Variables Setup](#8-environment-variables-setup)
9. [Common Issues & Debugging](#9-common-issues--debugging)

---

## 1. Understanding the Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET (Users)                      │
└──────────────┬───────────────────────┬──────────────────┘
               │                       │
        ┌──────▼──────┐         ┌──────▼──────┐
        │  Frontend   │         │  Frontend   │
        │  (Static)   │◄────────│  CDN/Nginx  │
        │  React+Vite │         │  Port 80    │
        └──────┬──────┘         └─────────────┘
               │ API Calls
        ┌──────▼──────┐
        │   Backend   │
        │  Express.js │
        │  Port 5000  │
        └──────┬──────┘
               │ Internal HTTP
        ┌──────▼──────┐         ┌─────────────┐
        │  AI Agent   │────────►│  MongoDB    │
        │  FastAPI    │         │  Atlas      │
        │  Port 8000  │         └─────────────┘
        └─────────────┘
```

**Why 3 services?**
- Frontend = static files (HTML/CSS/JS) → served by Nginx or CDN
- Backend = business logic (auth, appointments) → needs Node.js runtime
- AI Agent = ML/AI logic (LangGraph, FAISS) → needs Python runtime

Each service runs independently so they can:
- Scale separately (AI might need more CPU/RAM)
- Deploy independently (fix a frontend bug without restarting AI)
- Use different languages/runtimes

---

## 2. Pre-Deployment Fixes

Before deploying, your code needs these changes:

### Why?
In development, you use `localhost:5000`, `localhost:8000` etc. In production, services live at different URLs (like `api.khancare.com`). We use **environment variables** so the same code works everywhere.

### Changes needed:
1. **Backend `package.json`** — hosting platforms look for `"start"` script
2. **Backend `index.js`** — CORS and AI URL must come from env vars
3. **AI Agent `server.py`** — CORS must come from env vars
4. **Frontend** — already uses `import.meta.env.VITE_AI_URL` ✅

---

## 3. Docker — What & Why

### What is Docker?
Docker is like a "shipping container" for your app. It packages your code + all dependencies + runtime into a single box that runs identically everywhere.

### Why Docker?
| Without Docker | With Docker |
|---|---|
| "Works on my machine" problem | Works everywhere identically |
| Install Node, Python, dependencies manually | Everything pre-installed in container |
| Different OS on server vs laptop | Same Linux container everywhere |
| Conflicting versions across projects | Each container is isolated |

### Key Concepts:
- **Dockerfile** = Recipe to build your container image
- **Image** = The built package (like a .zip of your app)
- **Container** = A running instance of an image
- **Docker Compose** = Run multiple containers together (frontend + backend + AI)
- **Registry** = Where you store images (Docker Hub, AWS ECR)

### How it works:
```
Dockerfile → (docker build) → Image → (docker run) → Container
                                │
                                └→ Push to Registry → Pull on Server → Run
```

---

## 4. Creating Dockerfiles

### 4A. Backend Dockerfile

Each line explained:

```dockerfile
# Stage 1: Use Node.js runtime as base
# WHY: Our backend needs Node.js to run. Alpine = tiny Linux (5MB vs 900MB)
FROM node:20-alpine

# WHY: Sets the "current directory" inside the container
WORKDIR /app

# WHY: Copy package files FIRST (Docker caches layers — if these don't change,
# npm install is skipped on rebuild, saving 2-3 minutes each time)
COPY package*.json ./

# WHY: Install only production dependencies (no nodemon, no devDependencies)
RUN npm ci --only=production

# WHY: Now copy the rest of your code
COPY . .

# WHY: Tell Docker this container listens on port 5000
EXPOSE 5000

# WHY: The command that starts your app when container runs
CMD ["node", "index.js"]
```

### 4B. AI Agent Dockerfile

```dockerfile
# WHY: Python 3.11 slim = smaller than full Python image (150MB vs 900MB)
FROM python:3.11-slim

WORKDIR /app

# WHY: System dependencies needed by some Python packages (FAISS, cryptography)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# WHY: Copy & install requirements first (Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# WHY: Copy all code + vector_database folder
COPY . .

# WHY: FastAPI runs via uvicorn. 0.0.0.0 = accept connections from outside container
# --workers 2 = handle multiple requests simultaneously (production setting)
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### 4C. Frontend Dockerfile (Multi-stage build)

```dockerfile
# Stage 1: BUILD the React app
# WHY: We need Node.js to run "vite build", but not to SERVE the files
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# WHY: Build-time env vars for Vite (baked into the JS bundle)
ARG VITE_API_URL
ARG VITE_AI_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_AI_URL=$VITE_AI_URL

RUN npm run build

# Stage 2: SERVE with Nginx (tiny, fast web server)
# WHY: After build, we only have static HTML/CSS/JS files.
# Nginx serves static files 100x faster than Node.js and uses 10MB RAM vs 100MB
FROM nginx:alpine

# WHY: Copy our built files to where Nginx looks for them
COPY --from=builder /app/dist /usr/share/nginx/html

# WHY: Custom nginx config to handle React Router (client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Multi-stage build explained:**
```
Stage 1 (builder): Node.js + all deps + source → runs "npm run build" → produces /dist folder
Stage 2 (final):   Nginx + /dist folder only

Result: Final image is ~25MB instead of ~1GB
```

---

## 5. Docker Compose — Local Testing

### What is Docker Compose?
Instead of running 3 separate `docker run` commands with 10 flags each, you define everything in one YAML file and run `docker compose up`.

### Why use it?
- One command starts everything
- Services can talk to each other by name (e.g., `http://backend:5000`)
- Easy to add/remove services
- Perfect for local development that mirrors production

### How services communicate:
```
┌─── Docker Network (internal) ────────────────────────┐
│                                                       │
│  frontend ──► http://backend:5000  (by service name)  │
│  backend  ──► http://ai-agent:8000 (by service name)  │
│                                                       │
└───────────────────────────────────────────────────────┘
```

Docker Compose creates a private network where containers find each other by their service name. This is why in `docker-compose.yml` we set `AI_AGENT_URL=http://ai-agent:8000`.

---

## 6. Deploy to Render

### Why Render?
- Free tier available
- Auto-deploys from GitHub
- Handles HTTPS, custom domains
- No server management needed
- Perfect for projects like this

### Step-by-Step:

#### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add deployment configs"
git push origin main
```

#### Step 2: Deploy Backend (Web Service)
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Name**: `khancare-backend`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm ci`
   - **Start Command**: `node index.js`
   - **Plan**: Free (or Starter $7/mo for always-on)
4. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `JWT_SECRET` = any long random string
   - `PORT` = 5000
   - `FRONTEND_URL` = (add after frontend deploys)
   - `AI_AGENT_URL` = (add after AI deploys)

#### Step 3: Deploy AI Agent (Web Service)
1. New → Web Service
2. Settings:
   - **Name**: `khancare-ai`
   - **Root Directory**: `ai_agent`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Starter ($7/mo — AI needs more RAM, free tier will OOM)
3. Environment Variables:
   - `GOOGLE_API_KEY` = your Gemini key
   - `OPENAI_API_KEY` = your OpenAI key
   - `MONGO_URL` = your MongoDB Atlas string
   - `ALLOWED_ORIGINS` = `https://khancare-frontend.onrender.com`

> ⚠️ **Important**: Your vector_database/ is gitignored! You need to either:
> - Remove it from .gitignore for deployment, OR
> - Add a build step that runs `python index.py` to rebuild it

#### Step 4: Deploy Frontend (Static Site)
1. New → Static Site (FREE!)
2. Settings:
   - **Name**: `khancare-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`
3. Environment Variables (build-time):
   - `VITE_API_URL` = `https://khancare-backend.onrender.com`
   - `VITE_AI_URL` = `https://khancare-ai.onrender.com`

#### Step 5: Update CORS URLs
Go back to backend and AI services, update their CORS env vars with the actual Render URLs.

#### Render Architecture:
```
User → khancare-frontend.onrender.com (Static Site, FREE)
         │
         ├─ API calls → khancare-backend.onrender.com (Web Service)
         │                    │
         │                    └─→ khancare-ai.onrender.com (Web Service)
         │
         └─ Direct AI → khancare-ai.onrender.com
```

---

## 7. Deploy to AWS (Production)

### Why AWS?
- Industry standard for production apps
- More control, better performance
- Auto-scaling, load balancing
- But: More complex, costs money

### AWS Options (Easiest → Hardest):

| Service | Complexity | Cost | Best For |
|---|---|---|---|
| **AWS App Runner** | Easy | ~$5-15/mo | Small apps, auto-scaling |
| **AWS ECS Fargate** | Medium | ~$10-30/mo | Container orchestration |
| **AWS ECS + EC2** | Hard | ~$20-50/mo | Full control |
| **AWS EKS (Kubernetes)** | Expert | ~$75+/mo | Large-scale microservices |

### Recommended: AWS App Runner (Easiest Docker deployment on AWS)

#### Prerequisites:
1. AWS Account
2. AWS CLI installed (`winget install Amazon.AWSCLI`)
3. Docker Desktop installed

#### Step 1: Install & Configure AWS CLI
```bash
aws configure
# Enter: Access Key ID, Secret Key, Region (ap-south-1 for India)
```

#### Step 2: Create ECR Repositories (Docker image storage)
```bash
# ECR = Elastic Container Registry (AWS's Docker Hub)
aws ecr create-repository --repository-name khancare-backend
aws ecr create-repository --repository-name khancare-ai
```

#### Step 3: Build & Push Docker Images
```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com

# Build backend
cd backend
docker build -t khancare-backend .
docker tag khancare-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/khancare-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/khancare-backend:latest

# Build AI agent
cd ../ai_agent
docker build -t khancare-ai .
docker tag khancare-ai:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/khancare-ai:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-south-1.amazonaws.com/khancare-ai:latest
```

#### Step 4: Create App Runner Services (via AWS Console)
1. Go to AWS Console → App Runner
2. Create Service:
   - Source: ECR → select your image
   - Port: 5000 (backend) or 8000 (AI)
   - CPU: 1 vCPU, Memory: 2GB
   - Add environment variables
3. Repeat for AI agent

#### Step 5: Frontend on AWS
For the frontend (static files), use **S3 + CloudFront**:
```bash
# Build frontend
cd frontend
npm run build

# Create S3 bucket
aws s3 mb s3://khancare-frontend

# Upload built files
aws s3 sync dist/ s3://khancare-frontend --delete

# Create CloudFront distribution (CDN) — via console is easier
```

#### AWS Architecture:
```
User → CloudFront (CDN) → S3 (static frontend)
         │
         ├─→ App Runner (backend, auto-scales)
         │         │
         │         └─→ App Runner (AI agent, auto-scales)
         │
         └─→ MongoDB Atlas (database, separate)
```

---

## 8. Environment Variables Setup

### Production Environment Variables:

#### Backend (.env on server):
```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/khan_care_db
JWT_SECRET=your-super-long-random-secret-key-here-min-32-chars
FRONTEND_URL=https://your-frontend-domain.com
AI_AGENT_URL=https://your-ai-service-domain.com
NODE_ENV=production
```

#### AI Agent (.env on server):
```
GOOGLE_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/khan_care_db
ALLOWED_ORIGINS=https://your-frontend-domain.com,https://your-backend-domain.com
```

#### Frontend (build-time):
```
VITE_API_URL=https://your-backend-domain.com
VITE_AI_URL=https://your-ai-service-domain.com
```

> ⚠️ **Security**: NEVER put API keys in frontend env vars. `VITE_` vars are visible to everyone in the browser!

---

## 9. Common Issues & Debugging

### Issue: Container starts but crashes immediately
**Why**: Usually missing env vars or wrong port
**Fix**: Check logs with `docker logs <container-name>`

### Issue: Services can't talk to each other
**Why**: Using `localhost` inside Docker. Containers are isolated!
**Fix**: Use service names in Docker Compose (`http://backend:5000`), or actual URLs in production

### Issue: Frontend shows CORS error
**Why**: Backend CORS doesn't allow the frontend's domain
**Fix**: Add frontend URL to `FRONTEND_URL` env var in backend

### Issue: AI agent OOM (Out of Memory)
**Why**: FAISS + LangChain + Gemini client use ~500MB-1GB RAM
**Fix**: Use at least 1GB RAM plan (Render Starter or AWS 2GB)

### Issue: Frontend routes show 404 on refresh
**Why**: Nginx/server doesn't know about React Router client-side routes
**Fix**: The `nginx.conf` we create has `try_files $uri /index.html` which fixes this

### Issue: Vector database not found
**Why**: `vector_database/` is gitignored
**Fix**: Either un-gitignore it, or run `python index.py` in Docker build step

### Docker Useful Commands:
```bash
# Build all services
docker compose build

# Start all services
docker compose up

# Start in background (detached)
docker compose up -d

# See logs
docker compose logs -f backend

# Stop everything
docker compose down

# Rebuild one service
docker compose build backend
docker compose up -d backend

# Enter a running container (debug)
docker exec -it khancare-backend sh

# See running containers
docker ps

# See image sizes
docker images
```

---

## Deployment Checklist

- [ ] All hardcoded URLs replaced with env vars
- [ ] Backend has `"start": "node index.js"` script
- [ ] All 3 Dockerfiles created and tested locally
- [ ] `docker compose up` works locally
- [ ] MongoDB Atlas IP whitelist set to `0.0.0.0/0` (allow all — needed for cloud)
- [ ] All API keys ready for production
- [ ] Vector database included in AI agent image (or rebuild script added)
- [ ] CORS configured for production domains
- [ ] Frontend env vars set at BUILD time (not runtime)
- [ ] Health check endpoints working (`/` for backend, `/health` for AI)
