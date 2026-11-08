@echo off
title EchoVault Frontend
cd /d "%~dp0frontend"
echo ===================================================
echo   Starting EchoVault Frontend (React + Vite :5173)
echo ===================================================
call npm run dev
pause
