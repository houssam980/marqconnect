# 🚀 DigitalOcean VPS Deployment Guide for MarqConnect

## 📋 Complete Step-by-Step Guide to Deploy Laravel Backend + React Frontend + MySQL + Pusher

---

## 🎯 Overview

This guide will help you deploy your MarqConnect application stack:
- **Backend**: Laravel PHP application (from `C:\wamp64\www\marqconnect_backend`)
- **Frontend**: React + Vite application (from `C:\Users\surface\Desktop\MarqConnect`)
- **Database**: MySQL
- **Real-time**: Pusher Cloud
- **Server**: DigitalOcean VPS (Ubuntu 22.04 LTS)

---

## 📦 Pre-Deployment Checklist

### ✅ What You Need Before Starting:

1. **DigitalOcean Account** - Sign up at https://digitalocean.com
2. **Domain Name** (Optional but recommended) - e.g., `marqconnect.com`
3. **Pusher Cloud Account** - Your credentials:
   - App ID: `2088769`
   - Key: `d0db7eef206dad3d35ba`
   - Secret: `c05907ceae48e1e63c79`
   - Cluster: `eu`

4. **Local Backup** - Backup your WAMP database before migration:
   ```bash
   # Export from phpMyAdmin or command line:
   mysqldump -u root -p marqconnect > marqconnect_backup.sql
   ```

5. **SSH Key** (Recommended) - Generate if you don't have one:
   ```powershell
   ssh-keygen -t rsa -b 4096 -C "your_email@example.com"
   ```

---

## 🖥️ PART 1: Create DigitalOcean Droplet (VPS)

### Step 1.1: Create Droplet

1. **Log into DigitalOcean Dashboard**
2. Click **"Create" → "Droplets"**
3. **Choose Configuration**:
   - **Image**: Ubuntu 22.04 LTS x64
   - **Droplet Size**: 
     - Starter: Basic ($12/month - 2GB RAM, 1 CPU, 50GB SSD)
     - Recommended: Basic ($18/month - 2GB RAM, 2 CPUs, 60GB SSD)
   - **Data Center**: Choose closest to your users (e.g., Frankfurt for EU)
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `marqconnect-server`

4. Click **"Create Droplet"**
5. **Note your Droplet IP**: e.g., `123.45.67.89`

### Step 1.2: Initial Server Access

```bash
# From Windows PowerShell
ssh root@YOUR_DROPLET_IP
# Enter password or use SSH key
```

---

## 🔧 PART 2: Server Setup & Software Installation

### Step 2.1: Update System

```bash
# Update package lists
apt update && apt upgrade -y

# Install essential tools
apt install -y curl wget git unzip software-properties-common
```

### Step 2.2: Install Nginx Web Server

```bash
# Install Nginx
apt install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Check status
systemctl status nginx

# Test: Visit http://YOUR_DROPLET_IP in browser - you should see Nginx welcome page
```

### Step 2.3: Install PHP 8.3 with Extensions

```bash
# Add PHP repository
add-apt-repository ppa:ondrej/php -y
apt update

# Install PHP 8.3 and required extensions for Laravel
apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
php8.3-xml php8.3-curl php8.3-zip php8.3-gd php8.3-bcmath \
php8.3-intl php8.3-soap php8.3-redis php8.3-tokenizer

# Verify PHP installation
php -v
# Should show: PHP 8.3.x
```

### Step 2.4: Install MySQL 8.0

```bash
# Install MySQL Server
apt install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

# Secure MySQL installation
mysql_secure_installation
# Follow prompts:
# - Set root password: Choose a STRONG password
# - Remove anonymous users: Y
# - Disallow root login remotely: Y
# - Remove test database: Y
# - Reload privilege tables: Y
```

### Step 2.5: Install Composer (PHP Dependency Manager)

```bash
# Download and install Composer
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
chmod +x /usr/local/bin/composer

# Verify installation
composer --version
```

### Step 2.6: Install Node.js & npm (for Frontend Build)

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify installation
node -v  # Should show v20.x.x
npm -v   # Should show 10.x.x
```

### Step 2.7: Install Certbot for SSL (If using domain)

```bash
# Install Certbot for Let's Encrypt SSL
apt install -y certbot python3-certbot-nginx
```

---

## 💾 PART 3: Database Migration & Setup

### Step 3.1: Create MySQL Database & User

```bash
# Login to MySQL
mysql -u root -p
# Enter the root password you set earlier
```

```sql
-- Create database
CREATE DATABASE marqconnect CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create dedicated user
CREATE USER 'marqconnect_user'@'localhost' IDENTIFIED BY 'YOUR_SECURE_PASSWORD_HERE';

-- Grant privileges
GRANT ALL PRIVILEGES ON marqconnect.* TO 'marqconnect_user'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

**⚠️ IMPORTANT**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password and save it!

### Step 3.2: Import Database from WAMP

**Option A: Transfer SQL file from Windows to VPS**

```powershell
# On Windows (PowerShell), from your backup location
scp marqconnect_backup.sql root@YOUR_DROPLET_IP:/root/
```

```bash
# On VPS, import the database
mysql -u marqconnect_user -p marqconnect < /root/marqconnect_backup.sql
# Enter the database user password

# Clean up
rm /root/marqconnect_backup.sql
```

**Option B: Fresh Installation (run migrations)**

We'll do this later after deploying Laravel.

---

## 🎯 PART 4: Deploy Laravel Backend

### Step 4.1: Create Web Directory Structure

```bash
# Create web root directory
mkdir -p /var/www/marqconnect

# Set ownership
chown -R www-data:www-data /var/www/marqconnect
```

### Step 4.2: Transfer Laravel Backend from Windows

**Option A: Using Git (Recommended)**

```bash
# On VPS
cd /var/www/marqconnect

# If your code is on GitHub/GitLab
git clone https://github.com/YOUR_USERNAME/marqconnect_backend.git backend

# Or initialize git and push from Windows:
```

**Option B: Using SCP/SFTP (Direct Transfer)**

```powershell
# On Windows PowerShell, from C:\wamp64\www\
# Compress backend folder first
Compress-Archive -Path C:\wamp64\www\marqconnect_backend -DestinationPath C:\wamp64\www\marqconnect_backend.zip

# Transfer to VPS
scp C:\wamp64\www\marqconnect_backend.zip root@YOUR_DROPLET_IP:/var/www/marqconnect/
```

```bash
# On VPS
cd /var/www/marqconnect
unzip marqconnect_backend.zip
mv marqconnect_backend backend
rm marqconnect_backend.zip
```

**Option C: Manual SFTP Upload**

Use FileZilla or WinSCP to upload `C:\wamp64\www\marqconnect_backend` to `/var/www/marqconnect/backend`

### Step 4.3: Install Laravel Dependencies

```bash
# Navigate to backend directory
cd /var/www/marqconnect/backend

# Install Composer dependencies (production mode)
composer install --optimize-autoloader --no-dev

# If you need Pusher (which you do):
composer require pusher/pusher-php-server
```

### Step 4.4: Configure Laravel Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit .env file
nano .env
```

**Update the following in `.env`:**

```env
# Application Settings
APP_NAME="MarqConnect"
APP_ENV=production
APP_KEY=base64:GENERATE_THIS_NEXT
APP_DEBUG=false
APP_URL=https://yourdomain.com  # Or http://YOUR_DROPLET_IP

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=marqconnect
DB_USERNAME=marqconnect_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE  # Same as Step 3.1

# Session & Cache
SESSION_DRIVER=file
CACHE_DRIVER=file
QUEUE_CONNECTION=database

# Pusher Cloud Configuration
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=2088769
PUSHER_APP_KEY=d0db7eef206dad3d35ba
PUSHER_APP_SECRET=c05907ceae48e1e63c79
PUSHER_APP_CLUSTER=eu
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https

# CORS Settings
SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com  # Or YOUR_DROPLET_IP
SESSION_DOMAIN=.yourdomain.com  # Or leave blank for IP

# Mail Configuration (Optional - for notifications)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=hello@marqconnect.com
MAIL_FROM_NAME="${APP_NAME}"
```

**Save and exit**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 4.5: Generate Application Key & Setup Laravel

```bash
# Generate application key
php artisan key:generate

# Run database migrations
php artisan migrate --force

# Create storage symlink
php artisan storage:link

# Cache configuration for performance
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Set correct permissions
chown -R www-data:www-data /var/www/marqconnect/backend
chmod -R 755 /var/www/marqconnect/backend
chmod -R 775 /var/www/marqconnect/backend/storage
chmod -R 775 /var/www/marqconnect/backend/bootstrap/cache
```

### Step 4.6: Configure Nginx for Laravel

```bash
# Create Nginx server block
nano /etc/nginx/sites-available/marqconnect
```

**Add this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Replace with your domain or use server IP
    server_name yourdomain.com www.yourdomain.com;  # Or: YOUR_DROPLET_IP
    
    root /var/www/marqconnect/backend/public;
    index index.php index.html;

    # Logging
    access_log /var/log/nginx/marqconnect-backend-access.log;
    error_log /var/log/nginx/marqconnect-backend-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # API location
    location /api {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Broadcasting auth
    location /broadcasting/auth {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP handler
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    # Static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Deny access to specific files
    location ~ /(composer\.json|composer\.lock|package\.json|\.env) {
        deny all;
    }
}
```

**Save and exit**

```bash
# Enable site
ln -s /etc/nginx/sites-available/marqconnect /etc/nginx/sites-enabled/

# Remove default site
rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

### Step 4.7: Test Backend API

```bash
# Test API endpoint
curl http://YOUR_DROPLET_IP/api/health
# Or visit in browser: http://YOUR_DROPLET_IP/api/health
```

---

## ⚛️ PART 5: Deploy React Frontend

### Step 5.1: Transfer Frontend Source

```powershell
# On Windows PowerShell
# Compress frontend
Compress-Archive -Path C:\Users\surface\Desktop\MarqConnect -DestinationPath C:\Users\surface\Desktop\MarqConnect.zip

# Transfer to VPS
scp C:\Users\surface\Desktop\MarqConnect.zip root@YOUR_DROPLET_IP:/var/www/marqconnect/
```

```bash
# On VPS
cd /var/www/marqconnect
unzip MarqConnect.zip
mv MarqConnect frontend
rm MarqConnect.zip
```

### Step 5.2: Configure Frontend Environment

```bash
cd /var/www/marqconnect/frontend

# Create production .env file
nano .env.production
```

**Add production environment variables:**

```env
# Pusher Cloud Configuration
VITE_PUSHER_APP_KEY=d0db7eef206dad3d35ba
VITE_PUSHER_CLUSTER=eu
VITE_PUSHER_AUTH_ENDPOINT=https://yourdomain.com/broadcasting/auth
VITE_API_BASE_URL=https://yourdomain.com

# Or if using IP temporarily:
# VITE_PUSHER_AUTH_ENDPOINT=http://YOUR_DROPLET_IP/broadcasting/auth
# VITE_API_BASE_URL=http://YOUR_DROPLET_IP
```

**Save and exit**

### Step 5.3: Build Frontend for Production

```bash
cd /var/www/marqconnect/frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output will be in 'dist' folder
```

### Step 5.4: Configure Nginx for React Frontend

```bash
# Create separate Nginx config for frontend
nano /etc/nginx/sites-available/marqconnect-frontend
```

**Add this configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    
    # Frontend domain (use subdomain or different domain)
    server_name app.yourdomain.com;  # Or: YOUR_DROPLET_IP
    
    root /var/www/marqconnect/frontend/dist;
    index index.html;

    # Logging
    access_log /var/log/nginx/marqconnect-frontend-access.log;
    error_log /var/log/nginx/marqconnect-frontend-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # React Router - SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy broadcasting auth to backend
    location /broadcasting {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets with long cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Alternative: Single Domain Setup (API as subdirectory)**

If you want both frontend and backend on the same domain:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /var/www/marqconnect/frontend/dist;
    index index.html;

    # API requests go to Laravel
    location /api {
        root /var/www/marqconnect/backend/public;
        try_files $uri $uri/ /index.php?$query_string;
        
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        }
    }

    # Broadcasting auth
    location /broadcasting {
        root /var/www/marqconnect/backend/public;
        try_files $uri $uri/ /index.php?$query_string;
        
        location ~ \.php$ {
            include snippets/fastcgi-php.conf;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        }
    }

    # React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Save and exit, then activate:**

```bash
# Enable frontend site
ln -s /etc/nginx/sites-available/marqconnect-frontend /etc/nginx/sites-enabled/

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

---

## 🔒 PART 6: SSL Certificate (HTTPS) Setup

### Step 6.1: Point Domain to VPS

Before getting SSL certificate:
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Add DNS A records:
   ```
   Type  | Name  | Value (IP Address)
   ------|-------|-------------------
   A     | @     | YOUR_DROPLET_IP
   A     | www   | YOUR_DROPLET_IP
   A     | app   | YOUR_DROPLET_IP (if using subdomain)
   ```
3. Wait for DNS propagation (5-30 minutes)

### Step 6.2: Obtain SSL Certificate (Let's Encrypt)

```bash
# Get certificate for main domain (backend)
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Get certificate for frontend subdomain (if separate)
certbot --nginx -d app.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose: Redirect HTTP to HTTPS (option 2)
```

**Certbot will automatically:**
- Obtain SSL certificate
- Update Nginx configuration
- Set up auto-renewal

### Step 6.3: Test SSL

Visit `https://yourdomain.com` in your browser - you should see the lock icon!

### Step 6.4: Setup Auto-Renewal

```bash
# Test renewal process
certbot renew --dry-run

# Certbot automatically sets up a cron job, but verify:
systemctl status certbot.timer
```

---

## 🔧 PART 7: Final Configuration & Testing

### Step 7.1: Update Laravel CORS for Production

```bash
nano /var/www/marqconnect/backend/config/cors.php
```

```php
<?php

return [
    'paths' => ['api/*', 'broadcasting/auth', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => [
        'https://yourdomain.com',
        'https://www.yourdomain.com',
        'https://app.yourdomain.com',  // If using subdomain
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
```

**Save, then clear cache:**

```bash
cd /var/www/marqconnect/backend
php artisan config:clear
php artisan config:cache
```

### Step 7.2: Update Frontend Environment Variables

```bash
nano /var/www/marqconnect/frontend/.env.production
```

**Update with HTTPS URLs:**

```env
VITE_PUSHER_APP_KEY=d0db7eef206dad3d35ba
VITE_PUSHER_CLUSTER=eu
VITE_PUSHER_AUTH_ENDPOINT=https://yourdomain.com/broadcasting/auth
VITE_API_BASE_URL=https://yourdomain.com
```

**Rebuild frontend:**

```bash
cd /var/www/marqconnect/frontend
npm run build
```

### Step 7.3: Setup Firewall (UFW)

```bash
# Enable UFW
ufw --force enable

# Allow SSH (IMPORTANT - do this first!)
ufw allow 22/tcp

# Allow HTTP & HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status verbose
```

### Step 7.4: Setup Process Manager (PM2) for Queue Workers

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file for Laravel queues
nano /var/www/marqconnect/backend/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'marqconnect-queue',
    script: 'artisan',
    args: 'queue:work --tries=3',
    interpreter: '/usr/bin/php',
    cwd: '/var/www/marqconnect/backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
  }]
};
```

```bash
# Start queue worker
cd /var/www/marqconnect/backend
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

### Step 7.5: Setup Cron Jobs for Laravel Scheduler

```bash
# Edit root crontab
crontab -e

# Add Laravel scheduler
* * * * * cd /var/www/marqconnect/backend && php artisan schedule:run >> /dev/null 2>&1
```

**Save and exit**

### Step 7.6: Create Health Check Endpoint

```bash
nano /var/www/marqconnect/backend/routes/api.php
```

Add at the top:

```php
// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'healthy',
        'timestamp' => now(),
        'database' => DB::connection()->getPdo() ? 'connected' : 'disconnected'
    ]);
});
```

Clear cache:

```bash
php artisan route:clear
php artisan route:cache
```

---

## 🧪 PART 8: Testing & Verification

### Step 8.1: Test Backend API

```bash
# Test health endpoint
curl https://yourdomain.com/api/health

# Test authentication (should return 401)
curl https://yourdomain.com/api/user

# Check Laravel logs
tail -f /var/www/marqconnect/backend/storage/logs/laravel.log
```

### Step 8.2: Test Frontend

1. **Visit** `https://yourdomain.com` (or `https://app.yourdomain.com`)
2. **Check browser console** for errors
3. **Test login/register** functionality
4. **Test real-time features** (messages, notifications)
5. **Check Pusher Dashboard** at https://dashboard.pusher.com for connection stats

### Step 8.3: Test Pusher Broadcasting

```bash
# Check broadcasting configuration
cd /var/www/marqconnect/backend
php artisan tinker

# In tinker, broadcast a test event:
>>> broadcast(new \App\Events\TestEvent());
>>> exit
```

Check Pusher Dashboard for the event.

### Step 8.4: Monitor Logs

```bash
# Nginx access logs
tail -f /var/log/nginx/marqconnect-backend-access.log
tail -f /var/log/nginx/marqconnect-frontend-access.log

# Nginx error logs
tail -f /var/log/nginx/marqconnect-backend-error.log
tail -f /var/log/nginx/marqconnect-frontend-error.log

# Laravel logs
tail -f /var/www/marqconnect/backend/storage/logs/laravel.log

# PHP-FPM logs
tail -f /var/log/php8.3-fpm.log

# MySQL slow query log (if enabled)
tail -f /var/log/mysql/mysql-slow.log
```

---

## 🚨 PART 9: Troubleshooting Common Issues

### Issue 1: 500 Internal Server Error (Laravel)

**Solution:**

```bash
# Check Laravel logs
tail -50 /var/www/marqconnect/backend/storage/logs/laravel.log

# Check permissions
cd /var/www/marqconnect/backend
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Clear all caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Re-cache
php artisan config:cache
php artisan route:cache
```

### Issue 2: CORS Errors

**Solution:**

```bash
# Update CORS config
nano /var/www/marqconnect/backend/config/cors.php
# Add your frontend domain to allowed_origins

# Clear config cache
php artisan config:clear
php artisan config:cache

# Restart PHP-FPM
systemctl restart php8.3-fpm
```

### Issue 3: Database Connection Failed

**Solution:**

```bash
# Check MySQL is running
systemctl status mysql

# Test database connection
mysql -u marqconnect_user -p marqconnect
# Enter password

# If failed, check .env database credentials
nano /var/www/marqconnect/backend/.env

# Clear config cache
php artisan config:clear
```

### Issue 4: Pusher Not Connecting

**Check:**
1. Pusher credentials in Laravel `.env`
2. Frontend `.env.production` has correct Pusher key
3. Broadcasting routes are accessible: `https://yourdomain.com/broadcasting/auth`
4. Check Pusher Dashboard for errors
5. Browser console for JavaScript errors

### Issue 5: File Upload Not Working

**Solution:**

```bash
# Check storage link exists
cd /var/www/marqconnect/backend
php artisan storage:link

# Set permissions
chmod -R 775 storage
chown -R www-data:www-data storage

# Increase PHP upload limits
nano /etc/php/8.3/fpm/php.ini
# Find and update:
# upload_max_filesize = 100M
# post_max_size = 100M

# Restart PHP-FPM
systemctl restart php8.3-fpm
```

### Issue 6: Nginx 502 Bad Gateway

**Solution:**

```bash
# Check PHP-FPM is running
systemctl status php8.3-fpm

# Restart PHP-FPM
systemctl restart php8.3-fpm

# Check socket file exists
ls -l /var/run/php/php8.3-fpm.sock

# Check Nginx error logs
tail -50 /var/log/nginx/marqconnect-backend-error.log
```

---

## 📊 PART 10: Performance Optimization

### Step 10.1: Enable OPcache (PHP)

```bash
nano /etc/php/8.3/fpm/php.ini
```

Enable/update these settings:

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=128
opcache.interned_strings_buffer=8
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
```

Restart PHP-FPM:

```bash
systemctl restart php8.3-fpm
```

### Step 10.2: Configure Laravel Caching

```bash
cd /var/www/marqconnect/backend

# Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Install Redis for better caching (optional)
apt install -y redis-server
composer require predis/predis

# Update .env to use Redis
nano .env
# Change:
# CACHE_DRIVER=redis
# SESSION_DRIVER=redis
# QUEUE_CONNECTION=redis

php artisan config:clear
php artisan config:cache
```

### Step 10.3: Enable Nginx Caching

```bash
nano /etc/nginx/sites-available/marqconnect
```

Add before `server` block:

```nginx
# Nginx cache configuration
fastcgi_cache_path /var/cache/nginx levels=1:2 keys_zone=marqconnect_cache:100m max_size=1g inactive=60m;
fastcgi_cache_key "$scheme$request_method$host$request_uri";
```

Add inside PHP location block:

```nginx
location ~ \.php$ {
    # ... existing config ...
    
    # FastCGI cache
    fastcgi_cache marqconnect_cache;
    fastcgi_cache_valid 200 60m;
    fastcgi_cache_bypass $http_pragma $http_authorization;
    add_header X-FastCGI-Cache $upstream_cache_status;
}
```

Create cache directory and restart:

```bash
mkdir -p /var/cache/nginx
chown www-data:www-data /var/cache/nginx
nginx -t
systemctl reload nginx
```

### Step 10.4: Database Optimization

```bash
# Login to MySQL
mysql -u root -p

# Optimize tables
USE marqconnect;
OPTIMIZE TABLE users, projects, messages, documents;

# Add indexes for performance (if not already present)
# Example:
ALTER TABLE messages ADD INDEX idx_created_at (created_at);
ALTER TABLE messages ADD INDEX idx_user_id (user_id);

EXIT;
```

---

## 🔄 PART 11: Deployment Automation & Updates

### Step 11.1: Create Deployment Script

```bash
nano /root/deploy-marqconnect.sh
```

```bash
#!/bin/bash

echo "🚀 Deploying MarqConnect..."

# Backend
echo "📦 Updating Backend..."
cd /var/www/marqconnect/backend

# If using Git:
git pull origin main
composer install --optimize-autoloader --no-dev

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Restart queue workers
pm2 restart marqconnect-queue

echo "✅ Backend deployed!"

# Frontend
echo "📦 Updating Frontend..."
cd /var/www/marqconnect/frontend

# If using Git:
git pull origin main
npm install
npm run build

echo "✅ Frontend deployed!"

# Restart services
systemctl reload nginx
systemctl restart php8.3-fpm

echo "🎉 Deployment complete!"
```

Make executable:

```bash
chmod +x /root/deploy-marqconnect.sh
```

**To deploy updates:**

```bash
/root/deploy-marqconnect.sh
```

---

## 📈 PART 12: Monitoring & Maintenance

### Step 12.1: Setup Monitoring

```bash
# Install htop for system monitoring
apt install -y htop

# Monitor system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep php
ps aux | grep nginx
```

### Step 12.2: Setup Log Rotation

Laravel logs can grow large. Setup log rotation:

```bash
nano /etc/logrotate.d/marqconnect
```

```
/var/www/marqconnect/backend/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
}
```

### Step 12.3: Database Backups

```bash
# Create backup script
nano /root/backup-marqconnect-db.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/marqconnect_$TIMESTAMP.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -u marqconnect_user -pYOUR_PASSWORD marqconnect > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "marqconnect_*.sql.gz" -mtime +30 -delete

echo "✅ Backup created: $BACKUP_FILE.gz"
```

Make executable:

```bash
chmod +x /root/backup-marqconnect-db.sh
```

Setup daily cron:

```bash
crontab -e

# Add daily backup at 2 AM
0 2 * * * /root/backup-marqconnect-db.sh >> /var/log/marqconnect-backup.log 2>&1
```

---

## 🎯 PART 13: Security Hardening

### Step 13.1: Disable Root SSH Login

```bash
nano /etc/ssh/sshd_config

# Find and change:
PermitRootLogin no
PasswordAuthentication no  # If using SSH keys

# Restart SSH
systemctl restart sshd
```

**⚠️ Before doing this, create a sudo user:**

```bash
adduser marqconnect
usermod -aG sudo marqconnect
su - marqconnect
# Test sudo works
```

### Step 13.2: Install Fail2Ban

```bash
# Install Fail2Ban
apt install -y fail2ban

# Configure
cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
nano /etc/fail2ban/jail.local

# Enable SSH protection
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600

# Start Fail2Ban
systemctl start fail2ban
systemctl enable fail2ban
```

### Step 13.3: Secure MySQL

```bash
# Disable remote root login
mysql -u root -p

DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
EXIT;
```

### Step 13.4: Setup Security Headers

Already configured in Nginx, but verify:

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self' https: wss:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;" always;
```

---

## ✅ Final Checklist

### Pre-Launch Verification:

- [ ] Backend API accessible at `https://yourdomain.com/api/health`
- [ ] Frontend loads at `https://yourdomain.com`
- [ ] User registration works
- [ ] User login works
- [ ] Database connections working
- [ ] File uploads work
- [ ] Pusher real-time features working
- [ ] Messages send and receive in real-time
- [ ] Notifications appear
- [ ] SSL certificate valid and HTTPS working
- [ ] All CORS issues resolved
- [ ] Broadcasting auth endpoint accessible
- [ ] Queue workers running (`pm2 list`)
- [ ] Cron jobs configured (`crontab -l`)
- [ ] Firewall configured (`ufw status`)
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] Error pages working (404, 500)

---

## 🆘 Need Help?

### Useful Commands Reference:

```bash
# View Laravel logs
tail -f /var/www/marqconnect/backend/storage/logs/laravel.log

# Restart all services
systemctl restart nginx php8.3-fpm mysql
pm2 restart all

# Clear Laravel cache
cd /var/www/marqconnect/backend
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Check service status
systemctl status nginx
systemctl status php8.3-fpm
systemctl status mysql
pm2 status

# Check disk space
df -h

# Check memory
free -h

# Test Nginx config
nginx -t

# View real-time logs
tail -f /var/log/nginx/error.log
```

---

## 📚 Additional Resources

- **DigitalOcean Docs**: https://docs.digitalocean.com/
- **Laravel Deployment**: https://laravel.com/docs/deployment
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Pusher Docs**: https://pusher.com/docs
- **Let's Encrypt**: https://letsencrypt.org/
- **Laravel Broadcasting**: https://laravel.com/docs/broadcasting

---

## 🎊 Congratulations!

Your MarqConnect application is now deployed on a production DigitalOcean VPS with:
- ✅ Laravel Backend with MySQL
- ✅ React Frontend (Vite)
- ✅ Pusher Cloud real-time features
- ✅ HTTPS/SSL security
- ✅ Automated backups
- ✅ Process monitoring
- ✅ Performance optimization

**Your app is live at**: `https://yourdomain.com` 🚀

---

## 💰 Estimated Monthly Cost

- **DigitalOcean Droplet** (2GB, 2 CPUs): $18/month
- **Domain Name**: $10-15/year
- **Pusher Cloud** (Free tier): $0 (up to 200k messages/day)
- **Let's Encrypt SSL**: Free

**Total**: ~$18-20/month

---

**Need help?** Drop a question in the DigitalOcean Community or check Laravel/Pusher documentation!

Good luck with your deployment! 🎉
