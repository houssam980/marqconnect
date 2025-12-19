# Fix Database and Cache
# Run this script to fix database tables and clear cache

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Laravel Database & Cache Fix Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find PHP executable
$phpPath = "C:\wamp64\bin\php\php8.3.28\php.exe"

if (-not (Test-Path $phpPath)) {
    # Try to find PHP in common WAMP locations
    $possiblePaths = @(
        "C:\wamp64\bin\php\php8.3.28\php.exe",
        "C:\wamp64\bin\php\php8.2.0\php.exe",
        "C:\wamp64\bin\php\php8.1.0\php.exe",
        "C:\wamp64\bin\php\php8.0.0\php.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $phpPath = $path
            break
        }
    }
    
    if (-not (Test-Path $phpPath)) {
        Write-Host "ERROR: PHP executable not found!" -ForegroundColor Red
        Write-Host "Please update the phpPath variable in this script." -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "Using PHP: $phpPath" -ForegroundColor Green
Write-Host ""

# Change to backend directory
$backendDir = "C:\wamp64\www\marqconnect_backend"
Set-Location $backendDir

# Run migrations
Write-Host "Step 1: Running database migrations..." -ForegroundColor Yellow
Write-Host "This will create all missing database tables (including personal_access_tokens)" -ForegroundColor Gray
Write-Host ""

try {
    & $phpPath artisan migrate --force
    Write-Host "✅ Migrations completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Clear cache
Write-Host "Step 2: Clearing Laravel cache..." -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "  Clearing config cache..." -ForegroundColor Cyan
    & $phpPath artisan config:clear
    
    Write-Host "  Clearing route cache..." -ForegroundColor Cyan
    & $phpPath artisan route:clear
    
    Write-Host "  Clearing application cache..." -ForegroundColor Cyan
    & $phpPath artisan cache:clear
    
    Write-Host "✅ Cache cleared successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Cache clear had some issues (may be permission-related)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ All fixes applied!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test your API endpoints" -ForegroundColor White
Write-Host "  2. Check if 500 errors are resolved" -ForegroundColor White
Write-Host "  3. If errors persist, check logs:" -ForegroundColor White
Write-Host "     C:\wamp64\www\marqconnect_backend\storage\logs\laravel.log" -ForegroundColor Gray
Write-Host ""


