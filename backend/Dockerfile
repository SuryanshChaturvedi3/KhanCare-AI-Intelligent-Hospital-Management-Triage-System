# ============================================
# KhanCare Backend — Dockerfile
# ============================================
# WHY node:20-alpine?
# - Node 20 = LTS (Long Term Support), stable for production
# - Alpine = tiny Linux distro (5MB vs 900MB full Ubuntu)
# - Result: Smaller image = faster deploys, less storage cost
FROM node:20-alpine

# WHY WORKDIR?
# Sets the "current folder" inside the container.
# All following commands (COPY, RUN, CMD) run from here.
WORKDIR /app

# WHY copy package*.json first?
# Docker builds in "layers". Each command = 1 layer.
# If package.json doesn't change, Docker reuses cached npm install (saves 2-3 min)
COPY package*.json ./

# WHY npm ci instead of npm install?
# npm ci = "clean install" — deletes node_modules first, installs exact versions
# More reliable for production. --omit=dev skips nodemon etc.
RUN npm ci --omit=dev

# WHY copy code AFTER npm install?
# Because code changes often, but dependencies don't.
# This way Docker only re-runs npm install when package.json changes.
COPY . .

# WHY EXPOSE?
# Documents which port the app listens on.
# Doesn't actually open the port — that's done in docker run/compose.
EXPOSE 5000

# WHY CMD as array?
# Array format ["node", "index.js"] runs directly (no shell wrapper).
# More efficient and handles signals (Ctrl+C / shutdown) properly.
CMD ["node", "index.js"]
