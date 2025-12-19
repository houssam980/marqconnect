# Add Android Storage Permissions Script
# Run this after: npm run cap:add:android

Write-Host "Adding storage permissions to AndroidManifest.xml..." -ForegroundColor Cyan

$manifestPath = "android\app\src\main\AndroidManifest.xml"

if (-Not (Test-Path $manifestPath)) {
    Write-Host "Error: AndroidManifest.xml not found at $manifestPath" -ForegroundColor Red
    Write-Host "Please run 'npm run cap:add:android' first!" -ForegroundColor Yellow
    exit 1
}

$manifestContent = Get-Content $manifestPath -Raw

# Check if permissions are already added
if ($manifestContent -match "READ_EXTERNAL_STORAGE") {
    Write-Host "Storage permissions already exist in AndroidManifest.xml" -ForegroundColor Green
    exit 0
}

# Define the permissions to add
$permissions = @"

    <!-- Storage Permissions for File Uploads -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
"@

# Add permissions before the <application> tag
$manifestContent = $manifestContent -replace '(<application)', "$permissions`n`n`$1"

# Write back to file
Set-Content -Path $manifestPath -Value $manifestContent -NoNewline

Write-Host "Storage permissions added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Permissions added:" -ForegroundColor Cyan
Write-Host "  - READ_EXTERNAL_STORAGE (Android 12 and below)"
Write-Host "  - WRITE_EXTERNAL_STORAGE (Android 12 and below)"
Write-Host "  - READ_MEDIA_IMAGES (Android 13+)"
Write-Host "  - READ_MEDIA_VIDEO (Android 13+)"
Write-Host "  - READ_MEDIA_AUDIO (Android 13+)"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run cap:sync"
Write-Host "  2. Commit and push to GitHub"
Write-Host "  3. GitHub Actions will build the APK automatically"
