@echo off
echo Setting up environment files...

echo.
echo Creating backend .env file...
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Backend .env file created!
) else (
    echo Backend .env file already exists, skipping...
)

echo.
echo Creating frontend .env file...
if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo Frontend .env file created!
) else (
    echo Frontend .env file already exists, skipping...
)

echo.
echo Setup complete! Please edit the .env files with your configuration.
echo.
echo IMPORTANT: 
echo - Update backend/.env with your MongoDB URI and a strong JWT_SECRET
echo - Frontend .env should work with defaults for local development
pause

