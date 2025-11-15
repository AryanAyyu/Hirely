# PowerShell script to create .env files from examples

Write-Host "Setting up environment files..." -ForegroundColor Cyan
Write-Host ""

# Backend .env
if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Backend .env file created!" -ForegroundColor Green
    } else {
        Write-Host "Creating backend\.env.example..." -ForegroundColor Yellow
        $backendEnv = @"
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/hirely

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_a_strong_random_string
JWT_EXPIRE=7d

# Frontend URL (for CORS and Socket.io)
FRONTEND_URL=http://localhost:5173
"@
        $backendEnv | Out-File -FilePath "backend\.env.example" -Encoding utf8
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "✓ Backend .env file created!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Backend .env file already exists, skipping..." -ForegroundColor Yellow
}

Write-Host ""

# Frontend .env
if (-not (Test-Path "frontend\.env")) {
    if (Test-Path "frontend\.env.example") {
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✓ Frontend .env file created!" -ForegroundColor Green
    } else {
        Write-Host "Creating frontend\.env.example..." -ForegroundColor Yellow
        $frontendEnv = @"
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
"@
        $frontendEnv | Out-File -FilePath "frontend\.env.example" -Encoding utf8
        Copy-Item "frontend\.env.example" "frontend\.env"
        Write-Host "✓ Frontend .env file created!" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Frontend .env file already exists, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Please edit the .env files with your configuration:" -ForegroundColor Yellow
Write-Host "  - backend/.env: Update MONGODB_URI and JWT_SECRET" -ForegroundColor White
Write-Host "  - frontend/.env: Should work with defaults for local development" -ForegroundColor White
Write-Host ""
Write-Host "To generate a secure JWT_SECRET, run:" -ForegroundColor Cyan
Write-Host "  node -e `"console.log(require('crypto').randomBytes(32).toString('hex'))`"" -ForegroundColor White

