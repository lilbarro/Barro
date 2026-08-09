@echo off
setlocal enabledelayedexpansion

echo Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js not found. Installing Node.js v20...
    winget install OpenJS.NodeJS --version 20.0.0 --silent
    if errorlevel 1 (
        echo Failed to install Node.js. Please install manually.
        pause
        exit /b 1
    )
    echo Node.js installation completed.
) else (
    for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
    for /f "tokens=1 delims=." %%j in ("!NODE_VERSION!") do set MAJOR_VERSION=%%j
    if !MAJOR_VERSION! LSS 20 (
        echo Node.js version is below v20. Installing Node.js v20...
        winget install OpenJS.NodeJS --version 20.0.0 --silent
        if errorlevel 1 (
            echo Failed to upgrade Node.js. Please upgrade manually.
            pause
            exit /b 1
        )
        echo Node.js upgrade completed.
    ) else (
        echo Node.js v20+ is already installed.
    )
)

echo Verifying Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Node.js verification failed. Please restart your command prompt and try again.
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set FINAL_VERSION=%%i
for /f "tokens=1 delims=." %%j in ("!FINAL_VERSION!") do set FINAL_MAJOR=%%j
if !FINAL_MAJOR! LSS 20 (
    echo Node.js version is still below v20. Please restart your command prompt and try again.
    pause
    exit /b 1
)

echo Node.js verification successful.
echo Installing dependencies...
npm install
if errorlevel 1 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

echo Starting the application...
npm start