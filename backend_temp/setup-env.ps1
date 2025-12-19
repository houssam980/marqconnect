# Add Reverb/Broadcasting configuration to .env file

$envFile = ".env"
$configLines = @"

# Broadcasting / WebSocket Configuration
BROADCAST_CONNECTION=reverb

# Reverb Configuration
REVERB_APP_ID=1
REVERB_APP_KEY=marqconnect
REVERB_APP_SECRET=marqconnect-secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SERVER_HOST=0.0.0.0
REVERB_SERVER_PORT=8080

# Vite Configuration
VITE_REVERB_APP_KEY=marqconnect
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
"@

# Check if .env exists
if (Test-Path $envFile) {
    # Check if REVERB config already exists
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "REVERB_APP_KEY") {
        Add-Content -Path $envFile -Value $configLines
        Write-Host "✓ WebSocket configuration added to .env" -ForegroundColor Green
    } else {
        Write-Host "✓ WebSocket configuration already exists in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "✗ .env file not found! Copy .env.example to .env first" -ForegroundColor Red
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: php artisan config:clear" -ForegroundColor White
Write-Host "2. Run: php artisan reverb:start" -ForegroundColor White



