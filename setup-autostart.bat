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

:: CLEANUP LEGACY STARTUP ITEMS
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ContentBlockerServices.lnk" (
    echo Removing legacy startup shortcut...
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ContentBlockerServices.lnk"
)

if exist "%~dp0start-hidden.vbs" (
    echo Removing legacy vbs script...
    del "%~dp0start-hidden.vbs"
)

schtasks /query /tn "ContentBlockerServices" >nul 2>&1
if %errorlevel%==0 (
    echo Removing legacy scheduled task...
    schtasks /delete /tn "ContentBlockerServices" /f >nul 2>&1
)

schtasks /query /tn "ContentBlockerServer" >nul 2>&1
if %errorlevel%==0 (
    echo Removing existing scheduled task...
    schtasks /delete /tn "ContentBlockerServer" /f >nul 2>&1
)
echo.

:: Create XML for scheduled task with proper power settings
set "TASK_XML=%TEMP%\ContentBlockerServer.xml"

echo ^<?xml version="1.0" encoding="UTF-16"?^> > "%TASK_XML%"
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^> >> "%TASK_XML%"
echo   ^<Triggers^> >> "%TASK_XML%"
echo     ^<LogonTrigger^> >> "%TASK_XML%"
echo       ^<Enabled^>true^</Enabled^> >> "%TASK_XML%"
echo     ^</LogonTrigger^> >> "%TASK_XML%"
echo   ^</Triggers^> >> "%TASK_XML%"
echo   ^<Settings^> >> "%TASK_XML%"
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^> >> "%TASK_XML%"
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^> >> "%TASK_XML%"
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^> >> "%TASK_XML%"
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^> >> "%TASK_XML%"
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^> >> "%TASK_XML%"
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^> >> "%TASK_XML%"
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^> >> "%TASK_XML%"
echo     ^<Enabled^>true^</Enabled^> >> "%TASK_XML%"
echo     ^<Hidden^>false^</Hidden^> >> "%TASK_XML%"
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^> >> "%TASK_XML%"
echo     ^<WakeToRun^>true^</WakeToRun^> >> "%TASK_XML%"
echo     ^<ExecutionTimeLimit^>PT0S^</ExecutionTimeLimit^> >> "%TASK_XML%"
echo     ^<Priority^>7^</Priority^> >> "%TASK_XML%"
echo   ^</Settings^> >> "%TASK_XML%"
echo   ^<Actions^> >> "%TASK_XML%"
echo     ^<Exec^> >> "%TASK_XML%"
echo       ^<Command^>"%~dp0start-services.bat"^</Command^> >> "%TASK_XML%"
echo       ^<WorkingDirectory^>%~dp0^</WorkingDirectory^> >> "%TASK_XML%"
echo     ^</Exec^> >> "%TASK_XML%"
echo   ^</Actions^> >> "%TASK_XML%"
echo   ^<Principals^> >> "%TASK_XML%"
echo     ^<Principal^> >> "%TASK_XML%"
echo       ^<RunLevel^>HighestAvailable^</RunLevel^> >> "%TASK_XML%"
echo     ^</Principal^> >> "%TASK_XML%"
echo   ^</Principals^> >> "%TASK_XML%"
echo ^</Task^> >> "%TASK_XML%"

:: Import the task from XML
schtasks /create /tn "ContentBlockerServer" /xml "%TASK_XML%" /f

:: Clean up temp file
del "%TASK_XML%"

if %errorlevel%==0 (
    echo.
    echo ========================================
    echo  SUCCESS! Autostart configured.
    echo ========================================
    echo.
    echo Services will now start automatically when you log in.
    echo Power settings configured to work on battery.
    echo.
) else (
    echo.
    echo ERROR: Failed to create scheduled task.
    echo.
)

pause