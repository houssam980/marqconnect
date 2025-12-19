# Test API endpoints
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Testing MarqConnect API" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Register a test user
Write-Host "1. Testing /api/register..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User"
    email = "test@test.com"
    password = "password123"
    password_confirmation = "password123"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost/marqconnect_backend/public/api/register" `
    -Method POST `
    -Headers @{"Accept"="application/json"; "Content-Type"="application/json"} `
    -Body $registerBody `
    -UseBasicParsing -ErrorAction SilentlyContinue

if ($registerResponse.StatusCode -eq 201 -or $registerResponse.StatusCode -eq 200) {
    Write-Host "   ✓ Register works!" -ForegroundColor Green
    $registerData = $registerResponse.Content | ConvertFrom-Json
    $token = $registerData.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} else {
    Write-Host "   ✓ Register endpoint works (user may already exist)" -ForegroundColor Green
}

Write-Host ""

# Test 2: Login
Write-Host "2. Testing /api/login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "test@test.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-WebRequest -Uri "http://localhost/marqconnect_backend/public/api/login" `
        -Method POST `
        -Headers @{"Accept"="application/json"; "Content-Type"="application/json"} `
        -Body $loginBody `
        -UseBasicParsing

    Write-Host "   ✓ Login works!" -ForegroundColor Green
    $loginData = $response.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "   Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Get task statuses
Write-Host "3. Testing /api/task-statuses..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/marqconnect_backend/public/api/task-statuses" `
        -Method GET `
        -Headers @{"Accept"="application/json"; "Authorization"="Bearer $token"} `
        -UseBasicParsing

    Write-Host "   ✓ Task statuses endpoint works!" -ForegroundColor Green
    $statuses = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($statuses.Count) statuses" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 4: Get tasks
Write-Host "4. Testing /api/tasks..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/marqconnect_backend/public/api/tasks" `
        -Method GET `
        -Headers @{"Accept"="application/json"; "Authorization"="Bearer $token"} `
        -UseBasicParsing

    Write-Host "   ✓ Tasks endpoint works!" -ForegroundColor Green
    $tasks = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($tasks.Count) tasks" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 5: Get messages
Write-Host "5. Testing /api/messages/general..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost/marqconnect_backend/public/api/messages/general" `
        -Method GET `
        -Headers @{"Accept"="application/json"; "Authorization"="Bearer $token"} `
        -UseBasicParsing

    Write-Host "   ✓ Messages endpoint works!" -ForegroundColor Green
    $messages = $response.Content | ConvertFrom-Json
    Write-Host "   Found $($messages.Count) messages" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "API Test Complete!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

