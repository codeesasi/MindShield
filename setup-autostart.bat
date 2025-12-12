@echo off
:: Setup auto-start on Windows login using Task Scheduler
:: Run this script as Administrator

echo ========================================
echo  MindShield Pro - Setup Autostart
echo ========================================
echo.

:: Check if running as Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: This script must be run as Administrator!
    echo Right-click and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo Creating Scheduled Task...
echo.

:: Create a scheduled task to run start-services.bat at logon
:: /tn : Task Name
:: /tr : Task Run (Path to batch file)
:: /sc : Schedule (onlogon)
:: /rl : Run Level (highest = admin)
:: /f  : Force overwrite
schtasks /create /tn "ContentBlockerServer" /tr "\"%~dp0start-services.bat\"" /sc onlogon /rl highest /f

if %errorlevel%==0 (
    echo.
    echo ========================================
    echo  SUCCESS! Autostart configured.
    echo ========================================
    echo.
    echo services will now start automatically when you log in.
    echo.
) else (
    echo.
    echo ERROR: Failed to create scheduled task.
    echo.
)

pause
