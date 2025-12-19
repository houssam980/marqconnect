# 🚀 VPS Deployment Guide

## Current Issues Fixed

✅ Centralized API configuration in `src/config/api.config.ts`
✅ Environment-based URL configuration
✅ Development and production environment templates

## 🔧 What Still Needs to Be Done

### **CRITICAL: Replace Hardcoded URLs**

The following files still have hardcoded `localhost` URLs and must be updated to use the new `apiRequest` helper:

1. **src/components/dashboard/NotificationBell.tsx** (6 occurrences)
2. **src/components/dashboard/widgets/TaskBoard.tsx** (11 occurrences)
3. **src/components/dashboard/pages/EquipePage.tsx** (3 occurrences)
4. **src/components/dashboard/pages/EventsPage.tsx** (4 occurrences)
5. **src/components/dashboard/pages/ProjectSpace.tsx** (15 occurrences)
6. **src/components/dashboard/pages/GeneralSpace.tsx** (3 occurrences)

### Example Refactoring:

**Before:**
```typescript
const response = await fetch("http://localhost/marqconnect_backend/public/api/users", {
  headers: {
    "Authorization": `Bearer ${token}`,
    "Accept": "application/json",
  },
});
```

**After:**
```typescript
import { apiRequest } from '@/config/api.config';

const response = await apiRequest('/users');
```

## 📋 VPS Deployment Checklist

### 1. **Backend (Laravel) Setup**

```bash
# On your VPS
cd /var/www/yourdomain.com
git clone your-repo-url backend

cd backend
composer install --optimize-autoloader --no-dev
cp .env.example .env
php artisan key:generate
```

**Update `.env` for production:**
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=2088769
PUSHER_APP_KEY=d0db7eef206dad3d35ba
PUSHER_APP_SECRET=c05907ceae48e1e63c79
PUSHER_APP_CLUSTER=eu

SANCTUM_STATEFUL_DOMAINS=yourdomain.com,www.yourdomain.com
SESSION_DOMAIN=.yourdomain.com
```

```bash
# Run migrations and optimize
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan optimize

# Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 2. **Frontend (React) Setup**

```bash
# On your local machine or VPS
cd frontend

# Copy and update production environment
cp .env.production.example .env.production
# Edit .env.production with your actual domain

# Build for production
npm run build

# Upload dist/ folder to VPS
```

### 3. **Nginx Configuration**

Create `/etc/nginx/sites-available/yourdomain.com`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    root /var/www/yourdomain.com/frontend/dist;
    index index.html;
    
    # Frontend - Serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API - Proxy to Laravel
    location /api {
        alias /var/www/yourdomain.com/backend/public;
        try_files $uri $uri/ @laravel;
        
        location ~ \.php$ {
            include fastcgi_params;
            fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
            fastcgi_param SCRIPT_FILENAME /var/www/yourdomain.com/backend/public/index.php;
        }
    }
    
    location @laravel {
        rewrite /api/(.*)$ /index.php?/$1 last;
    }
}
```

### 4. **SSL Certificate (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. **Database Setup**

```bash
# Create MySQL database
sudo mysql -u root -p

CREATE DATABASE your_database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'your_username'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON your_database.* TO 'your_username'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## ⚠️ Important Notes

1. **Refactor all hardcoded URLs** before deployment
2. **Update CORS configuration** in Laravel for your production domain
3. **Set up proper database backups**
4. **Configure firewall rules** (UFW or iptables)
5. **Set up monitoring** (e.g., Laravel Telescope, application monitoring)
6. **Enable Laravel queue workers** if using queues

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Disable `APP_DEBUG` in production
- [ ] Configure proper file permissions
- [ ] Set up HTTPS/SSL
- [ ] Configure rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates
- [ ] Database backups configured

## 🎯 Next Steps

1. **Refactor all components** to use `apiRequest` from `api.config.ts`
2. **Test the build** locally: `npm run build && npm run preview`
3. **Update environment variables** for production
4. **Deploy to VPS** following the checklist above
5. **Test thoroughly** on production before going live
