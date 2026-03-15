#!/bin/bash

# Less Compare - Development Startup Script for macOS/Linux
# Starts both backend and frontend servers

echo ""
echo "███████████████████████████████████████████████████████████████"
echo "         🚀 LESS COMPARE - DEVELOPMENT STARTUP"
echo "███████████████████████████████████████████████████████████████"
echo ""

# Check if Node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js first."
    exit 1
fi

echo "✅ Node.js detected: $(node --version)"
echo ""

# Kill existing processes on ports 3000 and 5173
echo "Checking for processes using ports 3000 and 5173..."
lsof -i :3000 >/dev/null 2>&1 && echo "⚠️  Port 3000 in use (will restart)"
lsof -i :5173 >/dev/null 2>&1 && echo "⚠️  Port 5173 in use (will restart)"
echo ""

# Start Backend in background
echo "📍 Starting Backend Server (Port 3000)..."
node server-new.js &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 2

# Start Frontend in background
echo "📍 Starting Frontend Server (Port 5173)..."
npm run dev &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

echo ""
echo "███████████████████████████████████████████████████████████████"
echo "                 ✅ SERVERS STARTING"
echo "███████████████████████████████████████████████████████████████"
echo ""
echo "🌐 Backend:  http://localhost:3000"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "⏳ Servers should be ready in a few seconds..."
echo ""

sleep 3

echo "📖 NEXT STEPS:"
echo "  1. Open http://localhost:5173 in your browser"
echo "  2. Type in the search box to test"
echo "  3. See results from multiple retailers"
echo ""
echo "📊 Testing:"
echo "  - Search for: rice, milk, bread, etc."
echo "  - Click \"Add\" to add to budget"
echo "  - Check health at: http://localhost:3000/api/search/health"
echo ""
echo "📚 Documentation: READ START_TESTING.md"
echo ""
echo "🛑 To stop servers: Press CTRL+C or run 'kill $BACKEND_PID $FRONTEND_PID'"
echo ""

# Wait for user to stop the script
wait
