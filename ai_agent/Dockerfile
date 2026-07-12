# ============================================
# KhanCare AI Agent — Dockerfile
# ============================================
# WHY python:3.11-slim?
# - Python 3.11 = fast, stable, compatible with all our packages
# - slim = smaller than full image (150MB vs 900MB), but has more tools than alpine
# - Alpine breaks some Python packages (numpy, FAISS) due to musl vs glibc
FROM python:3.11-slim

WORKDIR /app

# WHY install build-essential?
# Some Python packages (FAISS, cryptography) need C compiler to install.
# We install it, use it, then clean up to keep image small.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# WHY copy requirements.txt first?
# Same Docker layer caching trick as Node.js.
# Dependencies change rarely → cached → fast rebuilds.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# WHY copy everything (including vector_database)?
# FAISS index files are needed at runtime for medicine search.
# They're binary files that can't be installed via pip.
COPY . .

# WHY --host 0.0.0.0?
# By default uvicorn binds to 127.0.0.1 (localhost only).
# Inside Docker, "localhost" means inside the container — nothing can reach it!
# 0.0.0.0 = accept connections from outside the container.
#
# WHY --workers 2?
# 1 worker = 1 request at a time. If AI takes 5 seconds, all users wait.
# 2 workers = 2 requests simultaneously. Adjust based on CPU/RAM.
EXPOSE 8000
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
