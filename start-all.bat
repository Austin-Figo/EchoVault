@echo off
title Launch EchoVault
echo ===================================================
echo   Launching EchoVault Services
echo ===================================================
echo 1. Starting Backend on http://localhost:8080 ...
start "EchoVault Backend" cmd /k "%~dp0start-backend.bat"

echo 2. Waiting for backend initialization...
ping 127.0.0.1 -n 5 >nul

echo 3. Starting Frontend on http://localhost:5173 ...
start "EchoVault Frontend" cmd /k "%~dp0start-frontend.bat"

echo 4. Opening Browser at http://localhost:5173 ...
ping 127.0.0.1 -n 4 >nul
start http://localhost:5173

echo.
echo ===================================================
echo   EchoVault is live!
echo   Backend:  http://localhost:8080
echo   Frontend: http://localhost:5173
echo ===================================================
