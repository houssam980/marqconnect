# PowerShell script to fix all hardcoded API URLs to use VPS backend

$files = @(
    "src\components\dashboard\widgets\TaskBoard.tsx",
    "src\components\dashboard\NotificationBell.tsx",
    "src\components\dashboard\pages\EquipePage.tsx",
    "src\components\dashboard\pages\GeneralSpace.tsx"
)

$oldUrl = "http://localhost/marqconnect_backend/public/api/"
$newPattern = 'getApiUrl("/'

foreach ($file in $files) {
    $filePath = "C:\Users\surface\Desktop\MarqConnect\$file"
    if (Test-Path $filePath) {
        Write-Host "Processing $file..."
        $content = Get-Content $filePath -Raw
        
        # Replace all occurrences of hardcoded URL
        $content = $content -replace [regex]::Escape($oldUrl), $newPattern
        
        # Also replace template literals
        $content = $content -replace [regex]::Escape('`http://localhost/marqconnect_backend/public/api/'), 'getApiUrl(`/'
        
        # Save the file
        $content | Set-Content $filePath -NoNewline
        Write-Host "  ✓ Fixed $file"
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ All files processed!" -ForegroundColor Green
Write-Host "`n⚠️ IMPORTANT: You may need to manually add the import statement to files that don't have it:" -ForegroundColor Yellow
Write-Host 'import { getApiUrl } from "@/config/api.config";' -ForegroundColor Cyan
