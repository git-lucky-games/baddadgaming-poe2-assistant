@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed, or not on your PATH.
  echo Download and install it from https://nodejs.org, then run this script again.
  pause
  exit /b 1
)

echo Installing dependencies (first run may take a few minutes)...
call npm install
if errorlevel 1 (
  echo npm install failed - see the error above.
  pause
  exit /b 1
)

echo Starting Bad Cuz Dad...
call npm run dev

pause
