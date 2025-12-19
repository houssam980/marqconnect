Write-Host "Testing API..." -ForegroundColor Cyan

# Test login
Write-Host "Testing login..." -ForegroundColor Yellow
$loginBody = '{"email":"test@test.com","password":"password123"}'
$login = Invoke-RestMethod -Uri "http://localhost/marqconnect_backend/public/api/login" `
    -Method POST `
    -Headers @{"Accept"="application/json"; "Content-Type"="application/json"} `
    -Body $loginBody

$token = $login.token
Write-Host "✓ Login works! Token: $($token.Substring(0, 20))..." -ForegroundColor Green

# Test tasks
Write-Host "Testing /api/tasks..." -ForegroundColor Yellow
$tasks = Invoke-RestMethod -Uri "http://localhost/marqconnect_backend/public/api/tasks" `
    -Headers @{"Accept"="application/json"; "Authorization"="Bearer $token"}

Write-Host "✓ Tasks endpoint works! Found $($tasks.Count) tasks" -ForegroundColor Green

# Test task statuses
Write-Host "Testing /api/task-statuses..." -ForegroundColor Yellow
$statuses = Invoke-RestMethod -Uri "http://localhost/marqconnect_backend/public/api/task-statuses" `
    -Headers @{"Accept"="application/json"; "Authorization"="Bearer $token"}

Write-Host "✓ Task statuses works! Found $($statuses.Count) statuses" -ForegroundColor Green

Write-Host ""
Write-Host "All tests passed! ✓" -ForegroundColor Green



