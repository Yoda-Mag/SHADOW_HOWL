# 🚀 Shadow Howl - Your Production Deployment Configuration

**Lightsail Instance:** `18.134.190.37`  
**Region:** AWS Lightsail  
**OS:** Ubuntu (OS-Only)  
**Status:** ✅ READY TO DEPLOY  

---

## ✅ Your GitHub Secrets (FINAL)

Add these **exactly** to your GitHub repository settings:

```
HOST = 18.134.190.37
USERNAME = ubuntu
SSH_KEY = [your-private-key-pem-content]
VITE_API_URL = http://18.134.190.37/api
```

**How to add:**
1. Go to: GitHub → Your Repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add each one above

---

## ✅ Access URLs (Production)

### Your Application
- **Frontend:** `http://18.134.190.37`
- **API:** `http://18.134.190.37/api`
- **Health Check:** `http://18.134.190.37/api/health`

### SSH Access (From Your Local Machine)
```bash
ssh -i your-private-key.pem ubuntu@18.134.190.37
```

### MySQL Access (From Lightsail)
```bash
mysql -u shadow_user -p -h 127.0.0.1 shadow_howl
```

---

## ✅ Backend Configuration (.env on Lightsail)

```env
# Database (local)
DB_HOST=127.0.0.1
DB_USER=shadow_user
DB_PASSWORD=[your-strong-password]
DB_NAME=shadow_howl

# Server
NODE_ENV=production
PORT=5000

# API Keys
GEMINI_API_KEY=[your-api-key]
RESEND_API_KEY=[your-api-key]
JWT_SECRET=[generate-with: openssl rand -hex 32]

# CORS
ALLOWED_ORIGIN=http://18.134.190.37
```

---

## ✅ Frontend Configuration (.env on Lightsail)

```env
VITE_API_URL=http://18.134.190.37/api
```

---

## ✅ CORS Origins Configured (Backend)

Your backend now accepts requests from:
- `http://localhost` (development)
- `http://127.0.0.1` (local testing)
- `http://18.134.190.37` (production) ✨ **NEW**
- All ports: `:80`, `:3000`, `:5173`

---

## 🔄 Deployment Flow (Automated)

```
1. Push to main branch
          ↓
2. GitHub Actions triggers
          ↓
3. Backend tests (ESLint, syntax, DB config)
          ↓
4. Frontend tests (ESLint, build, API config)
          ↓
5. Deploy to 18.134.190.37 via SSH
   - Pull latest code
   - Install dependencies
   - Verify database connectivity ⬅️ SAFETY CHECK
   - Restart backend with PM2
   - Build frontend
   - Reload Nginx
   - Run health checks
          ↓
6. ✅ Deployment complete!
```

---

## 📋 Quick Checklist (Before First Deploy)

- [ ] GitHub Secrets added (4 secrets)
- [ ] SSH key added to GitHub SSH_KEY secret
- [ ] Lightsail instance running
- [ ] MySQL installed and running
- [ ] Database created (`shadow_howl`)
- [ ] Database user created (`shadow_user`)
- [ ] Nginx configured
- [ ] PM2 installed globally
- [ ] Project files in `/home/ubuntu/SHADOW_HOWL`

---

## 🧪 Testing Deployment (After First Deploy)

```bash
# From your local machine:
curl http://18.134.190.37/
curl http://18.134.190.37/api/health
curl http://18.134.190.37/api/auth/  # Will get auth error, but endpoint exists

# SSH to check logs:
ssh -i your-key.pem ubuntu@18.134.190.37
pm2 logs shadowhowl-backend
pm2 status
sudo systemctl status nginx
```

---

## 🔍 Monitoring

### View Logs
```bash
ssh -i key.pem ubuntu@18.134.190.37

# Backend
pm2 logs shadowhowl-backend --lines 50

# Nginx access
sudo tail -f /var/log/nginx/access.log

# Nginx errors
sudo tail -f /var/log/nginx/error.log

# MySQL
sudo tail -f /var/log/mysql/error.log
```

### Check Services
```bash
pm2 list
pm2 monit

sudo systemctl status nginx
sudo systemctl status mysql

df -h              # Disk space
free -h            # Memory
ps aux | grep node # Node processes
```

---

## 🆘 If Something Breaks

1. **Check GitHub Actions logs first**
   - Go to Actions → Latest workflow
   - See exactly where deployment failed

2. **SSH to Lightsail and debug**
   ```bash
   ssh -i key.pem ubuntu@18.134.190.37
   pm2 logs shadowhowl-backend
   ```

3. **Run verification**
   ```bash
   cd /home/ubuntu/SHADOW_HOWL/Backend
   node verify-db.js
   ```

4. **Restart services**
   ```bash
   pm2 restart shadowhowl-backend
   sudo systemctl restart nginx
   sudo systemctl restart mysql
   ```

---

## 📚 Documentation

- **Setup Guide:** [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)
- **CI/CD Guide:** [CI-CD_INTEGRATION_GUIDE.md](CI-CD_INTEGRATION_GUIDE.md)
- **Secrets Guide:** [GITHUB_SECRETS_SETUP.md](GITHUB_SECRETS_SETUP.md)
- **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Audit Report:** [PRODUCTION_READINESS_AUDIT.md](PRODUCTION_READINESS_AUDIT.md)

---

## ✨ What's Configured For You

✅ **Backend (Express.js)**
- Dynamic CORS with your IP
- Health check endpoint
- Database connection pooling
- Error handling
- JWT authentication
- All routes loaded

✅ **Frontend (React + Vite)**
- Dynamic API URL detection
- Development proxy
- Build optimization
- Asset caching

✅ **Database (MySQL)**
- Local-only access (127.0.0.1)
- Setup script provided
- Verification utility included

✅ **DevOps**
- GitHub Actions CI/CD
- Automated testing
- Automated deployment
- PM2 process management
- Nginx reverse proxy
- Firewall configuration

✅ **Monitoring & Logs**
- Health check endpoints
- PM2 logs
- Nginx logs
- MySQL logs

---

## 🎯 Next Steps

1. **Set GitHub Secrets** (5 minutes)
   ```
   HOST = 18.134.190.37
   USERNAME = ubuntu
   SSH_KEY = [your-pem-content]
   VITE_API_URL = http://18.134.190.37/api
   ```

2. **Commit code** (1 minute)
   ```bash
   git add .
   git commit -m "Configure production deployment for Lightsail 18.134.190.37"
   git push origin main
   ```

3. **Watch deployment** (3-5 minutes)
   - Go to GitHub → Actions
   - Watch workflow run
   - Check logs for any errors

4. **Test application** (2 minutes)
   ```bash
   curl http://18.134.190.37
   ```

**Total time:** ~15 minutes to full production deployment! 🚀

---

## Support

All commands and troubleshooting steps are in the documentation files above. If deployment fails, check:

1. GitHub Actions logs (exact error)
2. PM2 logs on Lightsail
3. Database connectivity (run `verify-db.js`)
4. CORS configuration (check Backend/index.js for your IP)

**Everything is configured and ready!** Just deploy. 🎉
