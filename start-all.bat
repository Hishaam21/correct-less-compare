@echo off
cd /d "%~dp0"
start "" cmd /k "node server.js"
timeout /t 2 > nul
start "" cmd /k "npm.cmd run dev"
