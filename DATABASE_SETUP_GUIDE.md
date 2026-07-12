# Database Setup Guide — MongoDB Atlas + Qdrant Cloud

> Both have FREE tiers. No credit card needed.

---

## Part 1: MongoDB Atlas (Cloud Database)

### What is MongoDB Atlas?
Your app currently uses `mongodb://127.0.0.1:27017` (local machine).
For deployment, you need a cloud database that's accessible from anywhere.
MongoDB Atlas = free cloud MongoDB hosted by MongoDB themselves.

### Step-by-Step:

#### Step 1: Create Account
1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. Sign up (Google account works)
3. Choose **FREE** tier (M0 Sandbox)

#### Step 2: Create a Cluster
1. After signup, click **"Build a Database"**
2. Choose **M0 FREE** (Shared)
3. Provider: **AWS** (or Google Cloud)
4. Region: Pick closest to you — **Mumbai (ap-south-1)** for India
5. Cluster Name: `KhanCareCluster` (or anything)
6. Click **"Create Cluster"** — takes 1-3 minutes

#### Step 3: Create Database User
1. Go to **Security → Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Fill in:
   - Username: `khancare_admin`
   - Password: Choose a strong password (NO special characters like `@#$%` — causes URL encoding issues)
   - Example: `KhanCare2024Secure`
4. Role: **Atlas Admin** (or Read and Write to any database)
5. Click **"Add User"**

#### Step 4: Whitelist IP Address
1. Go to **Security → Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → adds `0.0.0.0/0`
   - WHY? Your Docker containers / Render / AWS servers have dynamic IPs.
   - Restricting IPs would block your deployed services.
4. Click **"Confirm"**

#### Step 5: Get Connection String
1. Go to **Deployment → Database** (left sidebar)
2. Click **"Connect"** on your cluster
3. Choose **"Drivers"**
4. Copy the connection string. It looks like:
```
mongodb+srv://khancare_admin:KhanCare2024Secure@khancarecluster.abc123.mongodb.net/?retryWrites=true&w=majority
```
5. **Add your database name** at the end of the URL (before the `?`):

For Backend:
```
mongodb+srv://khancare_admin:KhanCare2024Secure@khancarecluster.abc123.mongodb.net/HospitalDB?retryWrites=true&w=majority
```

For AI Agent:
```
mongodb+srv://khancare_admin:KhanCare2024Secure@khancarecluster.abc123.mongodb.net/khan_care_db?retryWrites=true&w=majority
```

#### Step 6: Test Connection
You can test in terminal:
```bash
# Install mongosh if not already
mongosh "mongodb+srv://khancare_admin:KhanCare2024Secure@khancarecluster.abc123.mongodb.net/HospitalDB"
```
If it connects → you're good!

#### MongoDB Atlas — What You Get Free:
- 512 MB storage
- Shared RAM
- 100 max connections
- Perfect for development and small production apps

---

## Part 2: Qdrant Cloud (Vector Database)

### What is Qdrant Cloud?
Your app uses `http://localhost:6333` (local Qdrant).
For deployment, you need cloud Qdrant accessible from Render/AWS.
Qdrant Cloud = free hosted vector database.

### Step-by-Step:

#### Step 1: Create Account
1. Go to [https://cloud.qdrant.io](https://cloud.qdrant.io)
2. Sign up (Google/GitHub account works)

#### Step 2: Create a Cluster
1. Click **"Create Cluster"** (or "Create" button)
2. Settings:
   - Name: `khancare-vectors`
   - Cloud Provider: **AWS**
   - Region: **Mumbai** (or closest to you)
   - Plan: **Free** (1GB storage, 1M vectors)
3. Click **"Create"** — takes 30-60 seconds

#### Step 3: Get API Key
1. After cluster is created, go to **"Data Access Control"** or **"API Keys"**
2. Click **"Create API Key"**
3. Copy the API key — looks like:
```
abc123xyz456_YOUR_API_KEY_HERE
```
> ⚠️ Save this somewhere! You can only see it once.

#### Step 4: Get Cluster URL
1. On your cluster dashboard, find the **URL/Endpoint**
2. It looks like:
```
https://abc123-xyz456.aws.cloud.qdrant.io:6333
```

#### Step 5: Update Your Code for API Key

Since Qdrant Cloud requires authentication, you need to pass the API key.
Your `retriver_tool.py` and `index.py` need the API key in the client:

```python
# With API key (cloud)
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)
```

#### Qdrant Cloud — What You Get Free:
- 1 GB storage
- 1 Million vectors
- 1 node cluster
- Perfect for your medicine database (few thousand vectors)

---

## Part 3: Update Your .env Files

After creating both databases, update your files:

### ai_agent/.env (local development)
```
GOOGLE_API_KEY=AIzaSy...your-key
MONGO_URL=mongodb+srv://khancare_admin:PASSWORD@cluster.mongodb.net/khan_care_db?retryWrites=true&w=majority
QDRANT_URL=https://your-cluster.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
```

### backend/.env (local development)
```
PORT=5000
MONGO_URI=mongodb+srv://khancare_admin:PASSWORD@cluster.mongodb.net/HospitalDB?retryWrites=true&w=majority
JWT_SECRET=suryansh_123
FRONTEND_URL=http://localhost:5173
AI_AGENT_URL=http://127.0.0.1:8000
NODE_ENV=development
```

### .env (root — for Docker Compose)
```
MONGO_URI=mongodb+srv://khancare_admin:PASSWORD@cluster.mongodb.net/HospitalDB?retryWrites=true&w=majority
MONGO_URL=mongodb+srv://khancare_admin:PASSWORD@cluster.mongodb.net/khan_care_db?retryWrites=true&w=majority
JWT_SECRET=suryansh_123
GOOGLE_API_KEY=AIzaSy...your-key
QDRANT_URL=https://your-cluster.aws.cloud.qdrant.io:6333
QDRANT_API_KEY=your-qdrant-api-key
```

---

## Part 4: Rebuild Vector Database in Qdrant Cloud

After getting your Qdrant Cloud URL + API key, rebuild the index:

```bash
cd ai_agent
venv\Scripts\activate
python index.py
```

This uploads your medicine PDF data to Qdrant Cloud. Run it once — data persists forever.

---

## Summary — What Goes Where

```
┌─────────────────────────────────────────────────┐
│                YOUR APP                          │
├──────────────┬──────────────────────────────────┤
│  Backend     │  → MongoDB Atlas (HospitalDB)    │
│  (Express)   │    Users, Appointments, Auth     │
├──────────────┼──────────────────────────────────┤
│  AI Agent    │  → MongoDB Atlas (khan_care_db)  │
│  (FastAPI)   │    Chat memory/checkpoints       │
│              │                                  │
│              │  → Qdrant Cloud                  │
│              │    Medicine vectors (search)     │
│              │                                  │
│              │  → Google Gemini API             │
│              │    LLM + Embeddings              │
└──────────────┴──────────────────────────────────┘
```

---

## After Both Databases Are Ready

Your deployment order becomes:
1. ✅ Create MongoDB Atlas cluster + get URL
2. ✅ Create Qdrant Cloud cluster + get URL + API key
3. ✅ Update .env files with real URLs
4. ✅ Run `python index.py` to load data into Qdrant Cloud
5. ➡️ Deploy to Render/AWS (services connect to cloud DBs)
