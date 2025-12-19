# Clear Laravel Caches
# Run this script from the backend directory

Write-Host "Clearing Laravel caches..." -ForegroundColor Yellow

# Find PHP executable (adjust path if needed)
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

# Change to backend directory
$backendDir = "C:\wamp64\www\marqconnect_backend"
Set-Location $backendDir

# Clear caches
Write-Host "`nClearing config cache..." -ForegroundColor Cyan
& $phpPath artisan config:clear

Write-Host "Clearing route cache..." -ForegroundColor Cyan
& $phpPath artisan route:clear

Write-Host "Clearing application cache..." -ForegroundColor Cyan
& $phpPath artisan cache:clear

Write-Host "`n✅ All caches cleared successfully!" -ForegroundColor Green


