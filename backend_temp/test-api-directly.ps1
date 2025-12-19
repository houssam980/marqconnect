# Direct API Test Script
Write-Host "Testing MarqConnect API..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if Laravel is working
Write-Host "1. Testing Laravel health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost/marqconnect_backend/public/up" -ErrorAction Stop
    Write-Host "   ✓ Laravel is UP!" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Laravel is DOWN: $_" -ForegroundColor Red
    Write-Host "   Check if WAMP is running!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "2. Testing /api/user endpoint..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost/marqconnect_backend/public/api/user" -ErrorAction Stop
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ API endpoint works! (401 Unauthorized is expected)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ API Error: $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "If you see errors above, run:" -ForegroundColor Yellow
Write-Host "php artisan optimize:clear" -ForegroundColor White
Write-Host "================================" -ForegroundColor Cyan



