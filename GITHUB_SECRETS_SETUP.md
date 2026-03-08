# GitHub Secrets Configuration for AWS Lightsail Deployment

## Overview
Your CI/CD pipeline uses GitHub Secrets to securely store deployment credentials. These secrets are used by the deploy.yml workflow to SSH into your Lightsail instance.

---

## Required Secrets

### Deployment Secrets (Always Required)

#### 1. `HOST` - Your AWS Lightsail IP Address
- **Value:** `18.134.190.37`
- **Description:** Your Lightsail instance public IP

#### 2. `USERNAME` - SSH Username
- **Value:** `ubuntu`
- **Description:** Always `ubuntu` for AWS Lightsail OS-Only instances

#### 3. `SSH_KEY` - Private SSH Key
- **Value:** Contents of your private key `.pem` file
- **Description:** Used to SSH into your Lightsail instance

#### 4. `VITE_API_URL` - Frontend API URL
- **Value:** `http://18.134.190.37/api`
- **Description:** Where frontend communicates with backend

---

### Production Database Secrets (Required for Separate Database)

Since you use **separate databases for local and production**, add these secrets:

#### 5. `USER_DB_HOST` - Production Database Host
- **Value:** Your production database hostname or IP
- **Examples:**
  - AWS RDS: `shadow-howl.c123456.us-east-1.rds.amazonaws.com`
  - Self-hosted: `db.example.com`
  - Same Lightsail instance: `127.0.0.1`

#### 6. `USER_DB_PORT` - Database Port
- **Value:** `3306` (standard MySQL port)

#### 7. `USER_DB_USER` - Database Username
- **Value:** `shadow_user` (or your production user)

#### 8. `USER_DB_PASSWORD` - Database Password
- **Value:** Your production database password (strong, complex)
- **⚠️ SENSITIVE:** This is a secret - keep it safe!

#### 9. `USER_DB_NAME` - Database Name
- **Value:** `shadow_howl_prod` (or your production DB name)

---

### Optional API Keys (For Full Features)

#### 10. `GEMINI_API_KEY`
- **Value:** Your Google Gemini API key
- **Get from:** https://aistudio.google.com/

#### 11. `RESEND_API_KEY`
- **Value:** Your Resend email API key
- **Get from:** https://resend.com/

#### 12. `JWT_SECRET`
- **Value:** Generate with: `openssl rand -hex 32`
- **Description:** Secret key for JWT token signing

---

## Total Required Secrets Summary

```
Minimum (for deployment):
1. HOST = 18.134.190.37
2. USERNAME = ubuntu
3. SSH_KEY = [your-pem-content]
4. VITE_API_URL = http://18.134.190.37/api

For Production with Separate Database:
5. USER_DB_HOST = your_production_db_host
6. USER_DB_PORT = 3306
7. USER_DB_USER = shadow_user
8. USER_DB_PASSWORD = strong_password
9. USER_DB_NAME = shadow_howl_prod

Optional (for full features):
10. GEMINI_API_KEY = your_key
11. RESEND_API_KEY = your_key
12. JWT_SECRET = random_secret
```

---

## How to Add/Update Secrets

### Via GitHub Web UI:
1. Go to your repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret one by one:
   - Name: `HOST`
   - Value: `18.134.190.37`
5. Click "Add secret"
6. Repeat for each secret above

### Via GitHub CLI (Faster):
```bash
# Deployment credentials
gh secret set HOST --body "18.134.190.37"
gh secret set USERNAME --body "ubuntu"
gh secret set SSH_KEY --body "$(cat ~/.ssh/your-key.pem)"
gh secret set VITE_API_URL --body "http://18.134.190.37/api"

# Production database (separate database)
gh secret set USER_DB_HOST --body "your_production_db_host"
gh secret set USER_DB_PORT --body "3306"
gh secret set USER_DB_USER --body "shadow_user"
gh secret set USER_DB_PASSWORD --body "your_strong_password"
gh secret set USER_DB_NAME --body "shadow_howl_prod"

# Optional API keys
gh secret set GEMINI_API_KEY --body "your_key"
gh secret set RESEND_API_KEY --body "your_key"
gh secret set JWT_SECRET --body "$(openssl rand -hex 32)"
```

---

## Secret Values Reference

### Final Checklist (Copy These Exactly)

```
HOST = 18.134.190.37
USERNAME = ubuntu
SSH_KEY = [your-entire-pem-file-content]
VITE_API_URL = http://18.134.190.37/api

USER_DB_HOST = [your-production-db-address]
USER_DB_PORT = 3306
USER_DB_USER = shadow_user
USER_DB_PASSWORD = [your-strong-password]
USER_DB_NAME = shadow_howl_prod

GEMINI_API_KEY = [your-api-key]
RESEND_API_KEY = [your-api-key]
JWT_SECRET = [generate-with-openssl-rand-hex-32]
```
USERNAME = ubuntu
SSH_KEY = -----BEGIN RSA PRIVATE KEY-----
          MIIEowIBAAKCAQEA2x1u3q...
          ...entire key content...
          -----END RSA PRIVATE KEY-----

VITE_API_URL = http://18.134.190.37/api
```

**NEVER:**
- ❌ Copy SSH_KEY without the `-----BEGIN` and `-----END` lines
- ❌ Share these values in repositories or chat
- ❌ Use old/expired IP addresses
- ❌ Make secrets public

---

## Testing Your Secrets

### Verify SSH Connection:
```bash
# On your local machine, test SSH
ssh -i your-key.pem ubuntu@your-lightsail-ip

# Should connect without password
# If it fails, check SSH_KEY value
```

### Test Deployment Trigger:
1. Make a small change to `Backend/index.js` or `Frontend/src/App.jsx`
2. Commit and push to `main` branch
3. Watch GitHub Actions → Your workflow runs
4. Check logs to see if deployment succeeds

---

## Troubleshooting Secrets

### SSH Connection Failed
```
Error: ssh: Permission denied
```

**Fix:**
- Verify `SSH_KEY` contains the exact file contents
- Ensure it includes `-----BEGIN` and `-----END` lines
- Check `USERNAME` is exactly `ubuntu`
- Verify `HOST` is correct

### API URL Configuration Issues
```
Frontend showing: "Cannot connect to API"
```

**Fix:**
- Ensure `VITE_API_URL` includes `/api` at the end
- Check if Lightsail IP is correct
- Verify Nginx is running: `sudo systemctl status nginx`
- Test manually: `curl http://your-ip/api/health`

### Deployment Fails at Database Check
```
Database connection FAILED - ABORTING DEPLOYMENT
```

**Fix:**
- This is actually GOOD - it catches deployment issues early
- SSH into Lightsail: `ssh -i key.pem ubuntu@your-ip`
- Run: `cd ~/SHADOW_HOWL/Backend && node verify-db.js`
- Fix database issues, then retry deployment

---

## Security Best Practices

### 1. Rotate SSH Keys Regularly
```bash
# Generate new key pair on Lightsail
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa_new

# Update SSH_KEY secret in GitHub with new private key content
```

### 2. Limit Secret Scope
- These secrets are only used in the `deploy.yml` workflow
- They're not exposed in build logs (GitHub masks secrets)
- Only available to protected branches (main)

### 3. Audit Secret Usage
```bash
# In your repository, check which workflows use secrets:
grep -r "secrets\." .github/workflows/
```

### 4. Create a Deployment-Only User (Advanced)
Instead of using `ubuntu` user directly:
```bash
# On Lightsail (one-time setup)
sudo useradd -m -s /bin/bash deployer
sudo usermod -aG sudo deployer

# Generate SSH key for this user
# Grant only necessary permissions
# Use `deployer` as USERNAME secret instead
```

---

## Updating Secrets When IP Changes

If you recreate your Lightsail instance:

1. **Get new IP:**
   - AWS Lightsail Console → Copy new public IP

2. **Update SECRET:**
   - GitHub Settings → Secrets → HOST
   - Update value to new IP

3. **Test deployment:**
   - Make a test commit to trigger deploy.yml
   - Monitor GitHub Actions

---

## Deployment Flow with Secrets

```
1. You push to main branch
        ↓
2. GitHub Actions reads: secrets.HOST, secrets.USERNAME, secrets.SSH_KEY
        ↓
3. appleboy/ssh-action connects to your Lightsail instance
        ↓
4. Executes deployment script:
   - Pulls latest code
   - Installs dependencies
   - Verifies database
   - Restarts services
   - Checks health
        ↓
5. You see status in GitHub Actions logs
```

---

## Quick Setup Checklist

- [ ] Have Lightsail instance running
- [ ] Have SSH key (.pem file)
- [ ] Know your Lightsail public IP
- [ ] SSH into instance works: `ssh -i key.pem ubuntu@your-ip`
- [ ] `~/SHADOW_HOWL` directory exists on instance
- [ ] MySQL running: `sudo systemctl status mysql`
- [ ] Nginx running: `sudo systemctl status nginx`
- [ ] PM2 installed globally: `pm2 --version`
- [ ] Add 4 secrets to GitHub:
  - [ ] HOST
  - [ ] USERNAME
  - [ ] SSH_KEY
  - [ ] VITE_API_URL
- [ ] Test deployment with test commit

---

## Getting Help

If deployment fails:

1. **Check GitHub Actions logs:**
   - Your repo → Actions → Latest workflow run
   - Check "Deploy" job for error messages

2. **Check Lightsail logs:**
   ```bash
   ssh -i key.pem ubuntu@your-ip
   pm2 logs shadowhowl-backend
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Run verification script:**
   ```bash
   cd ~/SHADOW_HOWL/Backend
   node verify-db.js
   ```

4. **Check database connectivity:**
   ```bash
   mysql -u shadow_user -p -e "SELECT 1;"
   ```
