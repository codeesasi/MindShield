@echo off
echo ========================================
echo  MindShield Pro - Service Manager
echo ========================================
echo.

:: Navigate to project directory
cd /d "%~dp0"

echo [1/4] Installing dependencies...
cd server
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

:: echo.
:: echo [2/4] Starting MongoDB...
:: start "MongoDB" cmd /k "mongod --dbpath=C:\data\db"
:: timeout /t 3 /nobreak > nul

:: echo [3/4] Starting Ollama...
:: start "Ollama" cmd /k "ollama serve"
:: timeout /t 3 /nobreak > nul

echo [4/4] Starting Backend Server with PM2...

:: Check if PM2 is installed
where pm2 >nul 2>&1
if errorlevel 1 (
    echo WARNING: PM2 not found! Installing PM2 globally...
    call npm install -g pm2
    if errorlevel 1 (
        echo ERROR: Failed to install PM2!
        echo Please install manually: npm install -g pm2
        pause
        exit /b 1
    )
    echo PM2 installed successfully!
)

:: Navigate back to server directory
cd /d "%~dp0server"

:: Stop existing instance if running
call pm2 stop content-blocker 2>nul
call pm2 delete content-blocker 2>nul

:: Start server with PM2
call pm2 start index.js --name content-blocker --watch --max-memory-restart 200M

:: Save PM2 process list
call pm2 save

echo.
echo ========================================
echo  All services started successfully!
echo ========================================
echo.
echo  Backend:  http://localhost:3001 (PM2)
echo.
echo PM2 Commands:
echo  - View logs:    pm2 logs content-blocker
echo  - Stop server:  pm2 stop content-blocker
echo  - Restart:      pm2 restart content-blocker
echo  - Status:       pm2 status
echo.
echo Press any key to close this window..
pause > nul
