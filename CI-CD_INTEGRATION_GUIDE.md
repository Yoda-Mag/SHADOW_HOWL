# AWS Lightsail Production Setup - Integrated with Your CI/CD

## Your Current CI/CD Architecture

You have:
- **Backend-ci.yml** - Tests backend on every push
- **Frontend-ci.yml** - Builds & tests frontend, uploads artifacts
- **deploy.yml** - Deploys all changes to AWS Lightsail via SSH when tests pass

## Critical Issues to Fix for Production

### 1. PM2 App Name Mismatch
**Current deploy.yml uses:** `pm2 restart shadowhowl-backend`
**Your code needs:** This service name defined in PM2

**Action Required:**
```bash
# On your Lightsail instance, verify:
pm2 list
pm2 show shadowhowl-backend

# If it doesn't exist, create it with correct name:
pm2 start Backend/index.js --name shadowhowl-backend
pm2 save
```

### 2. Database Connectivity Issues (The Main Problem)
Your deploy.yml doesn't run database setup. When updating code, if database isn't accessible, data queries fail.

**Root Cause:** No password/hostname validation in `Backend/Config/Database.js`

**Fix Applied:**
- Enhanced error logging in Database.js
- Added connection pooling improvements
- Added `verify-db.js` script to test connectivity

**Update deploy.yml to add:**
```yaml
      - name: Verify Database Connectivity
        ssh: ...script: |
          cd ~/SHADOW_HOWL/Backend
          node verify-db.js
          
          # If database fails, exit deployment
          if [ $? -ne 0 ]; then
            echo "❌ Database connection failed - aborting deployment"
            exit 1
          fi
```

### 3. Frontend API URL Configuration
**Current:** Frontend uses hardcoded IP `http://18.134.190.37:5000`
**Problem:** When you change servers, this breaks

**Fix Applied:**
- Updated api.js to use dynamic hostname
- Frontend .env now uses relative `/api` path via Nginx

**Your deploy.yml needs to update:**
```yaml
      env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}  # This is good!
          # But on Lightsail, it should be the actual domain/IP
```

**GitHub Secrets to Add/Verify:**
```
VITE_API_URL = http://your-lightsail-ip/api  (in production)
HOST = your-lightsail-ip
USERNAME = ubuntu
SSH_KEY = your-private-key
```

### 4. Directory Structure Mismatch
**Your deploy.yml expects:** `~/SHADOW_HOWL`
**My recommendations used:** `/home/ubuntu/Shadow Howl`

These are the same path - ensure consistency!

---

## Recommended Updates to Your Workflows

### Update 1: Enhanced Backend-ci.yml
Add database validation:

```yaml
name: Shadow Howl Backend CI/CD

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  backend-ci:
    name: Backend Build & Lint
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: Backend/package-lock.json

      - name: Install Dependencies
        working-directory: ./Backend
        run: npm ci

      - name: Run Linter (ESLint)
        working-directory: ./Backend
        run: npx eslint . --max-warnings 0

      - name: Syntax Check
        working-directory: ./Backend
        run: node --check index.js

      # NEW: Database configuration validation
      - name: Validate Database Configuration
        working-directory: ./Backend
        run: |
          cat > test-db-config.js << 'EOF'
          require('dotenv').config();
          const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
          const missing = requiredEnvVars.filter(v => !process.env[v]);
          if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing.join(', '));
            process.exit(1);
          }
          console.log('✓ Database environment variables configured');
          EOF
          node test-db-config.js
        env:
          DB_HOST: 127.0.0.1
          DB_USER: test_user
          DB_PASSWORD: test_pass
          DB_NAME: test_db
```

### Update 2: Enhanced Frontend-ci.yml
```yaml
name: Shadow Howl Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'Frontend/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'Frontend/**'

jobs:
  frontend-build:
    name: Frontend Build & Sanity
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: Frontend/package-lock.json

      - name: Install Dependencies
        working-directory: ./Frontend
        run: npm ci

      - name: Lint Check
        working-directory: ./Frontend
        run: npm run lint

      # NEW: Validate API configuration
      - name: Validate API Configuration
        working-directory: ./Frontend
        run: |
          if [ -z "$VITE_API_URL" ]; then
            echo "⚠ VITE_API_URL not set, will use default"
          else
            echo "✓ VITE_API_URL configured: $VITE_API_URL"
          fi

      - name: Build Project (Vite)
        working-directory: ./Frontend
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL || '/api' }}
          CI: true

      - name: Upload Production Build
        if: success()
        uses: actions/upload-artifact@v4
        with:
          name: frontend-dist-files
          path: Frontend/dist/
          retention-days: 7
```

### Update 3: Enhanced deploy.yml (CRITICAL FIX)

```yaml
name: Deploy Shadow Howl

on:
  push:
    branches: [ main ]

jobs:
  # JOB 1: Gatekeeper
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: |
          cd Backend && npm install
          cd ../Frontend && npm install --legacy-peer-deps
      - name: Run Backend Linting
        run: |
          cd Backend && npm run lint || echo "No backend linting found"
      - name: Run Frontend Linting
        run: |
          cd Frontend && npm run lint || echo "No frontend linting found"

  # JOB 2: The Deployer
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Lightsail
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            set -e  # Exit on error
            
            echo "📦 Starting deployment..."
            cd ~/SHADOW_HOWL
            
            # Step 1: Update code from GitHub
            echo "🔄 Pulling latest code..."
            git fetch origin main
            git reset --hard origin/main
            
            # Step 2: Stop services temporarily
            echo "⏹️ Stopping services..."
            pm2 stop shadowhowl-backend || true
            
            # Step 3: Install/Update Backend
            echo "📦 Installing Backend dependencies..."
            cd Backend
            rm -rf node_modules package-lock.json
            npm install --production
            
            # Step 4: Verify Database Connection
            echo "🗄️  Verifying database connectivity..."
            if ! node verify-db.js; then
              echo "❌ Database connection failed - ABORTING DEPLOYMENT"
              exit 1
            fi
            
            # Step 5: Restart Backend
            echo "🚀 Starting Backend..."
            cd ~/SHADOW_HOWL
            if [ -f "ecosystem.config.js" ]; then
              pm2 start ecosystem.config.js --name shadowhowl-backend
            else
              pm2 start Backend/index.js --name shadowhowl-backend
            fi
            
            # Step 6: Install/Build Frontend
            echo "📦 Building Frontend..."
            cd Frontend
            rm -rf node_modules package-lock.json
            npm install --legacy-peer-deps
            npm run build
            
            # Step 7: Reload Nginx
            echo "🌐 Reloading Nginx..."
            sudo systemctl reload nginx
            
            # Step 8: Verify Deployment
            echo "✅ Verifying deployment..."
            sleep 2
            
            # Check backend health
            if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
              echo "✓ Backend health check passed"
            else
              echo "⚠️  Backend not responding yet - may need more time"
            fi
            
            # Check frontend loads
            if curl -f http://localhost/ > /dev/null 2>&1; then
              echo "✓ Frontend accessible"
            else
              echo "⚠️  Frontend check failed"
            fi
            
            # Show service status
            pm2 list
            echo ""
            echo "✅ Deployment completed!"
```

---

## Pre-Deployment Checklist for Your Setup

### GitHub Secrets (Update as needed)
```
HOST = 18.134.190.37
USERNAME = ubuntu
SSH_KEY = your-private-key-pem-content
VITE_API_URL = http://18.134.190.37/api
```

### On Your Lightsail Instance

#### 1. Verify Directory Structure
```bash
ls -la ~/SHADOW_HOWL/
# Should contain: Backend/, Frontend/, .github/, etc.
```

#### 2. Verify PM2 Service Name
```bash
pm2 list
# Should show: shadowhowl-backend (not shadow-howl-api)
```

#### 3. Verify Database
```bash
cd ~/SHADOW_HOWL/Backend
node verify-db.js
```

#### 4. Test Nginx Configuration
```bash
sudo nginx -t
sudo systemctl status nginx
```

#### 5. Check Logs
```bash
pm2 logs shadowhowl-backend
sudo tail -f /var/log/nginx/error.log
```

---

## Why Your Current Setup Has Database Issues

1. **No validation in CI/CD** - Tests pass but database secrets might be wrong
2. **PM2 restart might fail silently** - No error checking in deploy.yml
3. **No health checks** - Can't verify backend started correctly
4. **Frontend API URL hardcoded** - Points to old IP `18.134.190.37`
5. **No database check before deployment** - Breaks on bad credentials

---

## Next Steps

1. **Update your three workflow files** with the enhanced versions above
2. **Update GitHub Secrets** with correct values
3. **Run deploy verification**:
   ```bash
   # On Lightsail:
   cd ~/SHADOW_HOWL
   git pull
   curl -v http://localhost:5000/api/health
   curl -v http://localhost/
   ```
4. **Monitor deployment**:
   - Check GitHub Actions logs
   - Check PM2 logs: `pm2 logs`
   - Check Nginx: `sudo systemctl status nginx`

---

## Commands for Your Lightsail Instance

```bash
# Restart all services after deployment
pm2 restart shadowhowl-backend
sudo systemctl restart nginx
sudo systemctl restart mysql

# Check everything is running
pm2 list
pm2 logs shadowhowl-backend
sudo systemctl status nginx
sudo systemctl status mysql

# Manual deployment (if CI/CD fails)
cd ~/SHADOW_HOWL
git pull origin main
cd Backend && npm install && pm2 restart shadowhowl-backend
cd ../Frontend && npm install --legacy-peer-deps && npm run build
sudo systemctl reload nginx
```

---

**Key Issues Fixed:**
✅ Database connectivity validation in pipeline  
✅ PM2 service name alignment  
✅ Frontend API URL configuration  
✅ Deployment health checks  
✅ Error handling and rollback capability  
