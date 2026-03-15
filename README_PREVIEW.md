Preview instructions

1) Double-click `start-server.bat` to open a Command Prompt that runs the backend (keeps the window open).
2) Double-click `start-frontend.bat` to open a Command Prompt that runs the Vite dev server.

Or run both at once by double-clicking `start-all.bat`.

After both are running:
- Frontend will usually be available at http://localhost:5173
- Backend API will be available at http://localhost:3000

To test the search endpoint from Command Prompt:

curl -X POST http://localhost:3000/api/search -H "Content-Type: application/json" -d "{\"query\":\"rice 1kg\"}"

If you see "ERR_CONNECTION_REFUSED":
- Make sure the Command Prompt windows started by the .bat files show no immediate errors.
- If the backend process crashes, open `server-error.log` in the project root for details.
- Run `netstat -aon | findstr :3000` in Command Prompt to see if anything is listening.

Windows tips:
- If the .bat starts but nothing appears, run Command Prompt as Administrator and double-click again.
- The .bat files use `npm.cmd` to avoid PowerShell execution-policy issues.
