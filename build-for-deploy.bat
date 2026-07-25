@echo off
REM ============================================
REM Script để build Frontend Angular cho deploy
REM ============================================

setlocal enabledelayedexpansion

echo ========================================
echo Build Frontend for Deploy
echo ========================================

REM Đường dẫn gốc của dự án FE
set FE_ROOT=%~dp0
cd /d "%FE_ROOT%"

echo.
echo Step 1: Installing dependencies (if needed)...
echo ----------------------------------------
if not exist "node_modules" (
    echo Installing npm packages...
    call npm install
    if errorlevel 1 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules already exists
)

echo.
echo Step 2: Building Angular application (production)...
echo ----------------------------------------
call npm run build
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)
echo [OK] Frontend built successfully!

echo.
echo ========================================
echo Frontend Build Complete!
echo ========================================
echo.
echo Build output: %FE_ROOT%dist\EssayRater\browser
echo.
echo Next step: Run copy-frontend-to-deploy.bat to copy to backend deploy folder
echo.
pause










