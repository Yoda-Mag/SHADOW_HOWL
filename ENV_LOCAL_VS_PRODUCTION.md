# Environment Configuration Guide - Local vs Production

Your project uses **separate databases** for local development and production. This guide shows how to configure each.

---

## 🏠 LOCAL DEVELOPMENT Setup

### Backend `.env` (Local)

Create `.env` in `Backend/` directory:

```env
# ============================================
# Local Development Database
# ============================================
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_NAME=shadow_howl_local

# Server
NODE_ENV=development
PORT=5000
LOG_LEVEL=debug

# JWT (Use any random string for local testing)
JWT_SECRET=local_dev_secret_key_not_secure

# API Keys (Use your test keys or leave empty for local dev)
GEMINI_API_KEY=your_test_gemini_key
RESEND_API_KEY=your_test_resend_key

# CORS
ALLOWED_ORIGIN=http://localhost
```

### Frontend `.env` (Local)

Create `.env` in `Frontend/` directory:

```env
# Points to local backend
VITE_API_URL=http://localhost:5000/api
```

### Local Database Setup

```bash
# Create local database and user
mysql -u root -p
```

```sql
CREATE DATABASE shadow_howl_local CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'root_local'@'127.0.0.1' IDENTIFIED BY 'your_local_password';
GRANT ALL PRIVILEGES ON shadow_howl_local.* TO 'root_local'@'127.0.0.1';
FLUSH PRIVILEGES;
EXIT;
```

### Run Locally

```bash
# Terminal 1: Backend
cd Backend
npm install
node index.js

# Terminal 2: Frontend
cd Frontend
npm install
npm run dev
```

---

## 🚀 PRODUCTION Setup (AWS Lightsail)

### GitHub Secrets - Database Configuration

Add these to your GitHub repository secrets for **production deployment**:

```
# GitHub Settings → Secrets and variables → Actions
# → New repository secret

USER_DB_HOST = production_database_host
USER_DB_PORT = 3306
USER_DB_USER = shadow_user
USER_DB_PASSWORD = your_strong_production_password
USER_DB_NAME = shadow_howl_prod
```

### How CI/CD Injects Production Secrets

The `deploy.yml` workflow automatically sets production environment variables:

```yaml
# In deploy.yml (already configured)
env:
  DB_HOST: ${{ secrets.USER_DB_HOST }}
  DB_PORT: ${{ secrets.USER_DB_PORT }}
  DB_USER: ${{ secrets.USER_DB_USER }}
  DB_PASSWORD: ${{ secrets.USER_DB_PASSWORD }}
  DB_NAME: ${{ secrets.USER_DB_NAME }}
  VITE_API_URL: ${{ secrets.VITE_API_URL }}
```

### Production `.env` on Lightsail

When deployed, the backend `.env` on the Lightsail server will have:

```env
# These are set by GitHub Actions deploy.yml
DB_HOST=production_database_host
DB_PORT=3306
DB_USER=shadow_user
DB_PASSWORD=your_strong_production_password
DB_NAME=shadow_howl_prod

NODE_ENV=production
PORT=5000

# Production API keys
GEMINI_API_KEY=your_production_gemini_key
RESEND_API_KEY=your_production_resend_key
JWT_SECRET=your_production_jwt_secret

ALLOWED_ORIGIN=http://18.134.190.37
```

Frontend will use: `VITE_API_URL=http://18.134.190.37/api`

---

## 📋 Configuration Summary

| Config | Local | Production |
|--------|-------|------------|
| **Database Host** | `127.0.0.1` | Your prod database host |
| **Database Name** | `shadow_howl_local` | `shadow_howl_prod` |
| **Database User** | `root` | `shadow_user` |
| **API URL** | `http://localhost:5000/api` | `http://18.134.190.37/api` |
| **NODE_ENV** | `development` | `production` |
| **How Set** | Manual `.env` file | GitHub Secrets (CI/CD) |

---

## 🔄 Git Workflow

### Local Development
```bash
# 1. Create local .env (not committed)
echo "DB_HOST=127.0.0.1" > Backend/.env
# ... add all local configs

# 2. Code and test locally
npm run dev  # Frontend
node index.js  # Backend

# 3. Commit code (no .env files!)
git add Backend/index.js Frontend/src/...
git commit -m "Feature: Add X"
git push origin main
```

### Automatic Production Deployment
```
GitHub Actions (deploy.yml) runs:
  1. Pulls latest code from main
  2. Gets secrets from GitHub (production database)
  3. Creates production .env ← AUTOMATICALLY
  4. Deploys to Lightsail
  5. Uses production database
```

---

## ✅ Production Database Setup Quick Start

If your production database is **separate** (RDS, different server, etc.):

### Step 1: Setup Production Database
```bash
# On your production database server:
mysql -u admin -p
```

```sql
-- Production database
CREATE DATABASE shadow_howl_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Production user (with limited permissions)
CREATE USER 'shadow_user'@'%' IDENTIFIED BY 'your_strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON shadow_howl_prod.* TO 'shadow_user'@'%';
FLUSH PRIVILEGES;
```

### Step 2: Get Production Database Address
- If RDS: `shadow-howl.c123456.us-east-1.rds.amazonaws.com`
- If self-hosted: Your server's IP or hostname
- Port: Usually `3306`

### Step 3: Add GitHub Secrets
```
USER_DB_HOST = shadow-howl.c123456.us-east-1.rds.amazonaws.com
USER_DB_PORT = 3306
USER_DB_USER = shadow_user
USER_DB_PASSWORD = your_strong_password
USER_DB_NAME = shadow_howl_prod
```

### Step 4: Deploy
```bash
git push origin main  # Automatically deploys using production secrets
```

---

## 🧪 Testing Configuration

### Test Locally
```bash
cd Backend
node verify-db.js  # Should connect to local database
```

### Test Production After Deploy
```bash
ssh -i key.pem ubuntu@18.134.190.37

cd /home/ubuntu/SHADOW_HOWL/Backend
node verify-db.js  # Should connect to production database

# Check environment variables
env | grep DB_
```

---

## 🚨 Common Issues

### "Connection refused" locally
```bash
# Check if you have local .env with local database
cat Backend/.env | grep DB_HOST
# Should show: 127.0.0.1 or localhost

# Make sure local MySQL is running
mysql -u root -p -e "SELECT 1;"
```

### "Connection refused" in production
```bash
# SSH to Lightsail and check
ssh -i key.pem ubuntu@18.134.190.37
cd /home/ubuntu/SHADOW_HOWL/Backend

# Verify production secrets were applied
env | grep DB_

# Test database connection
node verify-db.js
```

### Different databases showing wrong data
```bash
# Check which .env is being used
cat Backend/.env | head -5

# Local: Should show localhost
# Production: Should show production host
```

---

## 📝 Checklist

### Local Development
- [ ] Created `Backend/.env` with local database
- [ ] Created `Frontend/.env` with localhost API
- [ ] Local MySQL running
- [ ] Local database created (`shadow_howl_local`)
- [ ] Can run `npm run dev` without errors
- [ ] Can access `http://localhost:5173`

### Production (Before First Deploy)
- [ ] Production database setup
- [ ] Got production database hostname
- [ ] Created GitHub Secret: `USER_DB_HOST`
- [ ] Created GitHub Secret: `USER_DB_PORT`
- [ ] Created GitHub Secret: `USER_DB_USER`
- [ ] Created GitHub Secret: `USER_DB_PASSWORD`
- [ ] Created GitHub Secret: `USER_DB_NAME`
- [ ] Created GitHub Secret: `VITE_API_URL` = `http://18.134.190.37/api`

### After First Production Deploy
- [ ] SSH to Lightsail works
- [ ] `pm2 logs shadowhowl-backend` shows "✓ Database connection successful"
- [ ] `curl http://18.134.190.37/api/health` returns healthy status
- [ ] Frontend loads at `http://18.134.190.37`
- [ ] Can log in and use the application

---

## TL;DR

**You have TWO separate databases:**

1. **Local (`shadow_howl_local`)**: For development
   - Set in local `.env` file
   - Not committed to git
   - Host: `127.0.0.1`

2. **Production (`shadow_howl_prod`)**: For Lightsail
   - Set via GitHub Secrets in CI/CD
   - Injected automatically during deploy
   - Host: Your production database address

**No manual .env setup needed in production** - GitHub Actions handles it! 🚀
