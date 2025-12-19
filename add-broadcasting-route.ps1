# PowerShell Script to Add Broadcasting Route to Laravel
# This script helps you add the Broadcast::routes() line to your Laravel routes/api.php

$routesFile = "C:\wamp64\www\marqconnect_backend\routes\api.php"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Laravel Broadcasting Route Fix" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (-not (Test-Path $routesFile)) {
    Write-Host "❌ File not found: $routesFile" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the path and try again." -ForegroundColor Yellow
    exit
}

Write-Host "✅ Found routes file: $routesFile" -ForegroundColor Green
Write-Host ""

# Read file content
$content = Get-Content $routesFile -Raw

# Check if Broadcast::routes already exists
if ($content -match "Broadcast::routes") {
    Write-Host "⚠️  Broadcast::routes() already exists in the file!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "The route should already be working." -ForegroundColor Yellow
    Write-Host "If you're still getting 404, try:" -ForegroundColor Yellow
    Write-Host "  1. Clear Laravel cache: php artisan route:clear" -ForegroundColor Cyan
    Write-Host "  2. Restart WAMP" -ForegroundColor Cyan
    exit
}

# Check if Broadcast use statement exists
$needsUseStatement = $content -notmatch "use Illuminate\\Support\\Facades\\Broadcast;"

if ($needsUseStatement) {
    Write-Host "📝 Adding 'use Illuminate\Support\Facades\Broadcast;' statement..." -ForegroundColor Yellow
    
    # Find the last use statement and add after it
    $usePattern = "(use\s+[^;]+;[\r\n]+)"
    if ($content -match $usePattern) {
        $content = $content -replace "($usePattern)", "`$1use Illuminate\Support\Facades\Broadcast;`r`n"
    } else {
        # Add after <?php
        $content = $content -replace "(<\?php[\r\n]+)", "`$1use Illuminate\Support\Facades\Broadcast;`r`n"
    }
}

# Add Broadcast::routes() after use statements, before other routes
Write-Host "📝 Adding Broadcast::routes()..." -ForegroundColor Yellow

# Try to add after Route::middleware or before first Route::
if ($content -match "(Route::middleware)") {
    $content = $content -replace "(Route::middleware)", "Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);`r`n`r`n`$1"
} elseif ($content -match "(Route::)") {
    $content = $content -replace "(Route::)", "Broadcast::routes(['middleware' => ['api', 'auth:sanctum']]);`r`n`r`n`$1"
} else {
    # Add at the end before closing
    $content = $content + "`r`nBroadcast::routes(['middleware' => ['api', 'auth:sanctum']]);`r`n"
}

# Write back to file
Set-Content -Path $routesFile -Value $content -NoNewline

Write-Host ""
Write-Host "✅ Successfully added Broadcast::routes() to routes/api.php" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Clear Laravel cache:" -ForegroundColor Cyan
Write-Host "   cd C:\wamp64\www\marqconnect_backend" -ForegroundColor White
Write-Host "   php artisan route:clear" -ForegroundColor White
Write-Host "   php artisan config:clear" -ForegroundColor White
Write-Host ""
Write-Host "2. Verify route exists:" -ForegroundColor Cyan
Write-Host "   php artisan route:list | findstr broadcasting" -ForegroundColor White
Write-Host ""
Write-Host "3. If route shows 'api/broadcasting/auth', update frontend .env:" -ForegroundColor Cyan
Write-Host "   VITE_PUSHER_AUTH_ENDPOINT=/api/broadcasting/auth" -ForegroundColor White
Write-Host ""
Write-Host "4. Restart frontend dev server" -ForegroundColor Cyan
Write-Host ""


