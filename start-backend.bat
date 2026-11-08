@echo off
title EchoVault Backend
cd /d "%~dp0backend"
echo ===================================================
echo   Starting EchoVault Backend (Spring Boot :8080)
echo ===================================================
java -jar target\echovault-backend-1.0.0-SNAPSHOT.jar
if %errorlevel% neq 0 (
    echo.
    echo Backend crashed or jar missing. Trying Maven runner...
    call mvnw.cmd spring-boot:run
)
pause
