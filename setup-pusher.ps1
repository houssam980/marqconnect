# Pusher Cloud Setup Script
# This script creates the .env file with your Pusher credentials

$envContent = @"
# Pusher Cloud Configuration
# Your Pusher Cloud credentials

VITE_PUSHER_APP_KEY=d0db7eef206dad3d35ba
VITE_PUSHER_CLUSTER=eu
VITE_PUSHER_AUTH_ENDPOINT=http://localhost/marqconnect_backend/public/broadcasting/auth
VITE_API_BASE_URL=http://localhost/marqconnect_backend/public
"@

# Write to .env file
$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure Laravel backend (see LARAVEL_ENV_CONFIG.txt)" -ForegroundColor Cyan
Write-Host "2. Restart your dev server: npm run dev" -ForegroundColor Cyan
Write-Host "3. Check browser console for: '✅ Connected to Pusher Cloud'" -ForegroundColor Cyan


