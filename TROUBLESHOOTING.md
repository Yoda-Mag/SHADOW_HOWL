# Production Deployment Checklist & Troubleshooting

## Pre-Deployment Checklist

### Local Development
- [ ] All dependencies installed (`npm install` in both Backend and Frontend)
- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env` file created with `VITE_API_URL`
- [ ] Backend starts successfully (`node index.js`)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] No console errors in Browser DevTools
- [ ] No errors in Backend console
- [ ] Can make API calls from frontend
- [ ] Database connectivity tested locally

### AWS Lightsail Instance Preparation
- [ ] Instance created (Ubuntu OS-Only)
- [ ] SSH access verified
- [ ] System updated (`sudo apt update && sudo apt upgrade -y`)
- [ ] Node.js installed (`node --version`)
- [ ] MySQL installed (`mysql --version`)
- [ ] Nginx installed (`nginx -v`)
- [ ] PM2 installed globally (`npm list -g pm2`)

### Database Setup (On Lightsail)
- [ ] MySQL started (`sudo systemctl status mysql`)
- [ ] Database created (`shadow_howl`)
- [ ] User created (`shadow_user`)
- [ ] Permissions granted
- [ ] setup.sql executed
- [ ] Database verified with `verify-db.js`

### Application Deployment (On Lightsail)
- [ ] Project files uploaded/cloned to `/home/ubuntu`
- [ ] Backend `.env` file created with correct production values
- [ ] Frontend `.env` file created with production API URL
- [ ] Dependencies installed in both directories
- [ ] Frontend built (`npm run build`)
- [ ] Backend starts with PM2
- [ ] Nginx configured correctly
- [ ] Firewall rules configured

### Final Verification (On Lightsail)
- [ ] Backend health check passes: `curl http://localhost:5000/api/health`
- [ ] Frontend loads: `curl http://localhost/`
- [ ] Can log in from browser
- [ ] Can fetch data from database
- [ ] All routes work
- [ ] No errors in PM2 logs
- [ ] No errors in Nginx logs

---

## Common Issues & Solutions

### Issue 1: Cannot Connect to Database

#### Symptom:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

#### Solutions:
```bash
# Check if MySQL is running
sudo systemctl status mysql

# Start MySQL if stopped
sudo systemctl start mysql

# Check MySQL listens on localhost
sudo netstat -tlnp | grep mysql

# Test connection directly
mysql -u shadow_user -p -h 127.0.0.1 -e "SELECT 1;"
```

#### If still failing:
```bash
# Check MySQL error log
sudo tail -f /var/log/mysql/error.log

# Restart MySQL
sudo systemctl restart mysql

# Run verification script
cd Backend && node verify-db.js
```

---

### Issue 2: Frontend Cannot Reach Backend API

#### Symptom:
```
GET http://localhost:5000/api/... 404 (Not Found)
CORS error
```

#### Solutions:

**Check 1: Backend is running**
```bash
pm2 status
pm2 logs shadow-howl-api
curl http://localhost:5000/api/health
```

**Check 2: Nginx reverse proxy**
```bash
# Check Nginx is running
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t

# Check Nginx can connect to backend
curl http://localhost/api/health
```

**Check 3: CORS configuration**
- Check Backend `index.js` corsOptions
- Verify origin is in allowedOrigins list
- Check browser console for CORS errors

**Check 4: Firewall rules**
```bash
sudo ufw status
sudo ufw allow 5000/tcp  # If needed
```

---

### Issue 3: "Database does not exist" Error

#### Symptom:
```
Error: ER_BAD_DB_ERROR
Database 'shadow_howl' doesn't exist
```

#### Solutions:
```bash
# Connect to MySQL as root
sudo mysql -u root -p

# Inside MySQL:
SHOW DATABASES;
CREATE DATABASE shadow_howl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Run setup script
mysql -u shadow_user -p shadow_howl < /home/ubuntu/Shadow\ Howl/Backend/Database/setup.sql
```

---

### Issue 4: "Access Denied" Error

#### Symptom:
```
Error: ER_ACCESS_DENIED_ERROR
Access denied for user 'shadow_user'@'127.0.0.1'
```

#### Solutions:
```bash
# Verify user exists
sudo mysql -u root -p -e "SELECT User, Host FROM mysql.user;"

# Check .env credentials match
cat /home/ubuntu/Shadow\ Howl/Backend/.env | grep DB_

# Reset user password
sudo mysql -u root -p
ALTER USER 'shadow_user'@'127.0.0.1' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# Update .env with new password
# Restart backend
pm2 restart shadow-howl-api
```

---

### Issue 5: 404 on API Endpoints

#### Symptom:
```
GET /api/signals → 404 Not Found
```

#### Solutions:

**Check 1: Routes are loaded**
```bash
# Check Backend logs
pm2 logs shadow-howl-api

# Should see: "Server running on port 5000"
# Should see all routes loaded
```

**Check 2: Correct endpoint URL**
- `/api/auth` for auth routes
- `/api/signals` for signal routes
- `/api/users` for user routes
- Check request method (GET, POST, etc)

**Check 3: Restart services**
```bash
pm2 restart shadow-howl-api
sudo systemctl restart nginx
```

---

### Issue 6: Frontend Showing Blank Page

#### Symptom:
```
Browser loads but shows nothing
Console shows 404 errors
```

#### Solutions:

**Check 1: Frontend built correctly**
```bash
ls -la /home/ubuntu/Shadow\ Howl/Frontend/dist/
# Should have index.html and other files

# If missing, rebuild:
cd /home/ubuntu/Shadow\ Howl/Frontend
npm run build
```

**Check 2: Nginx serving frontend**
```bash
# Check root path in Nginx config
cat /etc/nginx/sites-enabled/shadow-howl | grep root

# Test HTML is served
curl http://localhost/
```

**Check 3: Check Nginx logs**
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

---

### Issue 7: PM2 Application Won't Start

#### Symptom:
```
pm2 status shows "errored" or "stopped"
```

#### Solutions:
```bash
# Check error logs
pm2 logs shadow-howl-api --err

# Check if dependencies are installed
cd /home/ubuntu/Shadow\ Howl/Backend
npm list

# Reinstall if needed
rm -rf node_modules package-lock.json
npm install

# Start again
pm2 start ecosystem.config.js
```

---

### Issue 8: Gemini API Errors in Chat

#### Symptom:
```
Error: AI Error: Invalid API key
```

#### Solutions:
```bash
# Verify API key in .env
grep GEMINI_API_KEY /home/ubuntu/Shadow\ Howl/Backend/.env

# Get new key from: https://aistudio.google.com/
# Update .env with correct key
nano /home/ubuntu/Shadow\ Howl/Backend/.env

# Restart backend
pm2 restart shadow-howl-api
```

---

### Issue 9: Performance Issues / Slow Queries

#### Solutions:
```bash
# Check MySQL slow query log
sudo tail -f /var/log/mysql/slow.log

# Check server resources
top
df -h
free -h

# Check PM2 memory usage
pm2 monit

# If low on memory, restart services
pm2 restart shadow-howl-api
```

---

### Issue 10: SSL/HTTPS (Recommended for Production)

#### If using Let's Encrypt:
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx config
sudo nano /etc/nginx/sites-available/shadow-howl
# Add SSL directives:
# listen 443 ssl;
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Test and reload
sudo nginx -t
sudo systemctl reload nginx

# Auto-renew
sudo certbot renew --dry-run
```

---

## Quick Commands Reference

```bash
# Backend
pm2 start ecosystem.config.js              # Start backend
pm2 restart shadow-howl-api               # Restart
pm2 stop shadow-howl-api                  # Stop
pm2 logs shadow-howl-api                  # View logs
pm2 delete shadow-howl-api                # Remove

# Database
sudo mysql -u root -p                     # Connect as root
mysql -u shadow_user -p shadow_howl       # Connect as app user
mysqldump -u shadow_user -p shadow_howl > backup.sql  # Backup

# Nginx
sudo systemctl start nginx                # Start
sudo systemctl stop nginx                 # Stop
sudo systemctl restart nginx              # Restart
sudo systemctl status nginx               # Status
sudo nginx -t                             # Test config
sudo tail -f /var/log/nginx/access.log   # View access logs
sudo tail -f /var/log/nginx/error.log    # View error logs

# System
sudo reboot                               # Reboot server
sudo systemctl reboot                     # Reboot
uptime                                    # Server uptime
df -h                                     # Disk usage
free -h                                   # Memory usage
ps aux | grep node                        # Check Node processes
```

---

## Need More Help?

1. Check error logs first:
   - PM2: `pm2 logs shadow-howl-api`
   - Nginx: `/var/log/nginx/error.log`
   - MySQL: `/var/log/mysql/error.log`

2. Run verification:
   - `node verify-db.js`
   - `curl http://localhost:5000/api/health`
   - `curl http://localhost/api/health`

3. Check configurations:
   - Backend: `/home/ubuntu/Shadow Howl/Backend/.env`
   - Frontend: `/home/ubuntu/Shadow Howl/Frontend/.env`
   - Nginx: `/etc/nginx/sites-enabled/shadow-howl`

4. Still stuck? Restart everything:
   ```bash
   sudo systemctl restart mysql
   pm2 restart shadow-howl-api
   sudo systemctl restart nginx
   ```
