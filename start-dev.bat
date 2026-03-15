@echo off
REM Less Compare - Combined Startup Script
REM Starts both backend and frontend in separate windows

echo.
echo ███████████████████████████████████████████████████████████████
echo          🚀 LESS COMPARE - DEVELOPMENT STARTUP
echo ███████████████████████████████████████████████████████████████
echo.

REM Check if Node is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)

echo ✅ Node.js detected
echo.

REM Kill existing processes on ports 3000 and 5173
echo Checking for processes already using ports 3000 and 5173...
tasklist | findstr /C:"node" >nul
if %errorlevel% equ 0 (
    echo ⚠️  Found existing Node processes. You may need to restart if ports are in use.
    echo.
)

REM Start Backend
echo 📍 Starting Backend Server (Port 3000)...
start "Less Compare - Backend" cmd /k "node server-new.js"
timeout /t 2 /nobreak

REM Start Frontend
echo 📍 Starting Frontend Server (Port 5173)...
start "Less Compare - Frontend" cmd /k "npm run dev"
timeout /t 2 /nobreak

echo.
echo ███████████████████████████████████████████████████████████████
echo                    ✅ SERVERS STARTING
echo ███████████████████████████████████████████████████████████████
echo.
echo 🌐 Backend:  http://localhost:3000
echo 🌐 Frontend: http://localhost:5173
echo.
echo ⏳ Waiting for servers to be ready...
echo.
timeout /t 3 /nobreak

echo.
echo 📖 NEXT STEPS:
echo   1. Open http://localhost:5173 in your browser
echo   2. Type in the search box to test
echo   3. See results from multiple retailers
echo.
echo 📊 Testing:
echo   - Search for: rice, milk, bread, etc.
echo   - Click "Add" to add to budget
echo   - Check health at: http://localhost:3000/api/search/health
echo.
echo 📚 Documentation: READ START_TESTING.md
echo.
echo Press CTRL+C in either window to stop the servers.
echo.
pause
