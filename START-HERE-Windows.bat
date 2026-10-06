@echo off
REM ============================================================
REM   UTTAR BUNIYADI ASHRAM SHALA - DIGITAL CAMPUS SYSTEM
REM   Windows par website chalane ke liye ehe DOUBLE-CLICK karo
REM ============================================================
title School Digital Campus - Server
cd /d "%~dp0"

echo.
echo   ==========================================
echo    UTTAR BUNIYADI ASHRAM SHALA
echo    Digital Campus System
echo   ==========================================
echo.

REM ---- 1. Check Node.js ----
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   [ERROR] Node.js install nathi che.
  echo.
  echo   Step 1: nodejs.org par jao
  echo   Step 2: "LTS" button dabao ane install karo
  echo   Step 3: Ee file pehli var fari double-click karo
  echo.
  echo   Internet joiye che.
  echo.
  start "" https://nodejs.org
  pause
  exit /b 1
)

REM ---- 2. Install packages (first time only) ----
if not exist node_modules (
  echo   Pehli var: install thai ja rahi che...
  echo   Ee mate 1-2 minute lage che. Rah jaao.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo   [ERROR] Install fail thayu. Internet check karo.
    pause
    exit /b 1
  )
)

REM ---- 3. Wait for server ----
echo.
echo   Website start thai ja rahi che...

start "" cmd /c "timeout /t 4 >nul && start http://localhost:3000"

call npm start

echo.
echo   Server band thai gaya.
pause
