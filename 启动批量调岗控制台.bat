@echo off
cd /d "%~dp0"
start /b npm run server
timeout /t 2 >nul
start http://localhost:3000
