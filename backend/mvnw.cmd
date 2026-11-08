@REM Maven runner script for EchoVault backend
@echo off
setlocal
if exist "C:\Program Files\Apache\apache-maven-3.9.16\bin\mvn.cmd" (
    "C:\Program Files\Apache\apache-maven-3.9.16\bin\mvn.cmd" %*
) else (
    mvn %*
)
