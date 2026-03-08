# AWS Lightsail Production Setup Guide (Ubuntu OS-Only)

## Overview
This guide covers deploying Shadow Howl on AWS Lightsail with both backend and database on the same Ubuntu instance.

---

## Part 1: Initial Ubuntu Instance Setup

### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Node.js & npm
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version
```

### Step 3: Install MySQL Server
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation

# During setup:
# - Remove anonymous users: Y
# - Disable remote root login: Y
# - Remove test database: Y
# - Reload privileges: Y
```

### Step 4: Enable MySQL to Start on Boot
```bash
sudo systemctl enable mysql
sudo systemctl start mysql
```

### Step 5: Install Nginx (Reverse Proxy)
```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 6: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

---

## Part 2: Database Configuration for Local Access

### Step 1: Create Database User (Local Access Only)
```bash
sudo mysql -u root -p
```

Then execute in MySQL:
```sql
-- Create database
CREATE DATABASE shadow_howl CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user for local access only (127.0.0.1)
CREATE USER 'shadow_user'@'127.0.0.1' IDENTIFIED BY 'your_strong_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON shadow_howl.* TO 'shadow_user'@'127.0.0.1';

-- Flush privileges
FLUSH PRIVILEGES;

-- Verify
SELECT User, Host FROM mysql.user WHERE User='shadow_user';

EXIT;
```

### Step 2: Configure MySQL for Local Connections
```bash
# Verify MySQL listens on localhost only
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Find and verify this line exists:
```
bind-address = 127.0.0.1
```

Then restart MySQL:
```bash
sudo systemctl restart mysql
```

### Step 3: Test Database Connection
```bash
mysql -u shadow_user -p -h 127.0.0.1 shadow_howl
# If connection works, type EXIT to quit
```

---

## Part 3: Deploy Application

### Step 1: Upload Project Files
```bash
# From your local machine:
scp -r -i your-key.pem /path/to/Shadow Howl ubuntu@your-lightsail-ip:/home/ubuntu/
```

Or use Git:
```bash
cd /home/ubuntu
git clone your_repo_url Shadow\ Howl
cd Shadow\ Howl
```

### Step 2: Create Backend .env File
```bash
cd /home/ubuntu/Shadow\ Howl/Backend
sudo nano .env
```

Add this content:
```
# Database Configuration (Must use 127.0.0.1 for same instance)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=shadow_user
DB_PASSWORD=your_strong_password_here
DB_NAME=shadow_howl

# Server Configuration
NODE_ENV=production
PORT=5000
LOG_LEVEL=info

# API Keys
GEMINI_API_KEY=your_gemini_api_key_here
RESEND_API_KEY=your_resend_api_key_here

# JWT Secret (Generate: openssl rand -hex 32)
JWT_SECRET=your_jwt_secret_here
```

### Step 3: Create Frontend .env File
```bash
cd /home/ubuntu/Shadow\ Howl/Frontend
sudo nano .env
```

Add this content:
```
VITE_API_URL=http://localhost:5000/api
```

**Important**: Use `localhost` or `127.0.0.1` since frontend and backend are on same machine.

### Step 4: Install Dependencies
```bash
# Backend
cd /home/ubuntu/Shadow\ Howl/Backend
npm install

# Frontend
cd /home/ubuntu/Shadow\ Howl/Frontend
npm install
```

### Step 5: Build Frontend
```bash
cd /home/ubuntu/Shadow\ Howl/Frontend
npm run build
```

---

## Part 4: Setup Nginx Reverse Proxy

### Step 1: Create Nginx Config
```bash
sudo nano /etc/nginx/sites-available/shadow-howl
```

Add this config:
```nginx
upstream backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Frontend - React builds to dist/
    root /home/ubuntu/Shadow\ Howl/Frontend/dist;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
        expires 1h;
        add_header Cache-Control "public, immutable";
    }
    
    # Assets with long cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts for long connections
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ~$ {
        deny all;
    }
}
```

### Step 2: Enable Nginx Config
```bash
sudo ln -s /etc/nginx/sites-available/shadow-howl /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Part 5: Start Application with PM2

### Step 1: Create PM2 Ecosystem Config
```bash
sudo nano /home/ubuntu/Shadow\ Howl/ecosystem.config.js
```

Add this:
```javascript
module.exports = {
  apps: [{
    name: 'shadow-howl-api',
    script: '/home/ubuntu/Shadow Howl/Backend/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/tmp/shadow-howl-api-error.log',
    out_file: '/tmp/shadow-howl-api-out.log',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    exp_backoff_restart_delay: 100
  }]
};
```

### Step 2: Start Application
```bash
cd /home/ubuntu/Shadow\ Howl
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

Verify:
```bash
pm2 logs shadow-howl-api
pm2 status
```

---

## Part 6: Firewall & Security

### Step 1: Configure Ubuntu Firewall
```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS (for future SSL)
sudo ufw allow 3306/tcp    # MySQL (localhost only)
```

### Step 2: Configure MySQL Firewall (Local Only)
```bash
sudo ufw allow from 127.0.0.1 to 127.0.0.1 port 3306
```

---

## Part 7: Monitoring & Logs

### Check Backend Logs
```bash
pm2 logs shadow-howl-api
pm2 logs shadow-howl-api --lines 100
pm2 logs shadow-howl-api --err
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check MySQL Logs
```bash
sudo tail -f /var/log/mysql/error.log
```

---

## Part 8: Troubleshooting Database Connectivity

### If "Cannot fetch data from database" Error:

#### Check 1: Verify MySQL is Running
```bash
sudo systemctl status mysql
ps aux | grep mysql
```

#### Check 2: Test Connection Directly
```bash
mysql -u shadow_user -p -h 127.0.0.1 shadow_howl -e "SELECT 1;"
```

#### Check 3: Check Backend Logs
```bash
pm2 logs shadow-howl-api
```

#### Check 4: Verify .env File (Backend)
```bash
cat /home/ubuntu/Shadow\ Howl/Backend/.env
```

Must show:
```
DB_HOST=127.0.0.1
DB_USER=shadow_user
DB_PASSWORD=your_password
DB_NAME=shadow_howl
```

#### Check 5: Test from Backend Container
```bash
cd /home/ubuntu/Shadow\ Howl/Backend
node -e "
const mysql = require('mysql2');
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'shadow_user',
    password: 'your_password',
    database: 'shadow_howl'
});
pool.getConnection((err, conn) => {
    if (err) console.error('Connection Error:', err);
    else { console.log('✓ Connection successful!'); conn.release(); }
});
"
```

#### Check 6: Restart Services
```bash
sudo systemctl restart mysql
pm2 restart shadow-howl-api
sudo systemctl restart nginx
```

---

## Part 9: Updating Application

### To Deploy Updates:
```bash
cd /home/ubuntu/Shadow\ Howl

# Pull latest code (if using git)
git pull origin main

# Backend updates
cd Backend
npm install  # Only if dependencies changed
pm2 restart shadow-howl-api

# Frontend updates
cd ../Frontend
npm install  # Only if dependencies changed
npm run build
sudo systemctl restart nginx
```

---

## Part 10: Backup & Maintenance

### Backup Database
```bash
mysqldump -u shadow_user -p shadow_howl > /home/ubuntu/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Setup Automatic Backups (Weekly)
```bash
sudo nano /home/ubuntu/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u shadow_user -p'your_password' shadow_howl > $BACKUP_DIR/shadow_howl_$DATE.sql
# Keep only last 10 backups
ls -t $BACKUP_DIR/shadow_howl_*.sql | tail -n +11 | xargs rm -f
```

Make executable and add to cron:
```bash
chmod +x /home/ubuntu/backup.sh
(crontab -l 2>/dev/null; echo "0 2 * * 0 /home/ubuntu/backup.sh") | crontab -
```

---

## Part 11: Environment Variables Checklist

### Backend (.env)
- [ ] `DB_HOST=127.0.0.1`
- [ ] `DB_USER=shadow_user`
- [ ] `DB_PASSWORD=strong_password`
- [ ] `DB_NAME=shadow_howl`
- [ ] `NODE_ENV=production`
- [ ] `PORT=5000`
- [ ] `GEMINI_API_KEY=your_api_key`
- [ ] `RESEND_API_KEY=your_api_key`
- [ ] `JWT_SECRET=long_random_string`

### Frontend (.env)
- [ ] `VITE_API_URL=http://localhost:5000/api`

---

## Part 12: Final Testing

### Test 1: Frontend loads
```bash
curl http://your-lightsail-ip/
```

### Test 2: API responds
```bash
curl http://your-lightsail-ip/api/auth/health
```

### Test 3: Database query works
Access your app and try logging in or fetching signals.

---

## Support Commands

```bash
# View all processes
pm2 list

# View detailed logs
pm2 logs --lines 50

# Monitor in real-time
pm2 monit

# Restart all
pm2 restart all

# Restart specific
pm2 restart shadow-howl-api

# View app info
pm2 info shadow-howl-api

# Stop app
pm2 stop shadow-howl-api

# Delete app
pm2 delete shadow-howl-api

# View system stats
pm2 web  # Access http://localhost:9615
```

---

**Production Checklist:**
- [ ] Database created and user configured
- [ ] .env files created with correct credentials
- [ ] Frontend built (`npm run build`)
- [ ] PM2 running application
- [ ] Nginx configured and serving
- [ ] Firewall rules applied
- [ ] SSL certificate installed (recommended)
- [ ] Backups configured
- [ ] Monitoring in place
- [ ] Application tested end-to-end
