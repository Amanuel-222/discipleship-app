#!/bin/bash

# ── Discipleship App Launcher ──
# Starts MongoDB, the Express server, and the React client
# then opens the app in your browser automatically.

APP_DIR="$HOME/Downloads/discipleship-app"

# Start MongoDB if not already running
brew services start mongodb-community > /dev/null 2>&1

# Start the server in the background
cd "$APP_DIR/server"
nohup npm run dev > "$APP_DIR/server.log" 2>&1 &
SERVER_PID=$!
echo "✅ Server started (PID $SERVER_PID)"

# Wait for server to be ready
sleep 3

# Start the client in the background
cd "$APP_DIR/client"
nohup npm start > "$APP_DIR/client.log" 2>&1 &
CLIENT_PID=$!
echo "✅ Client started (PID $CLIENT_PID)"

# Save PIDs so the stop script can kill them
echo "$SERVER_PID" > "$APP_DIR/.server.pid"
echo "$CLIENT_PID" > "$APP_DIR/.client.pid"

# Wait for client to compile then open browser
sleep 8
open "http://localhost:3000"

echo ""
echo "🚀 Discipleship App is running at http://localhost:3000"
echo "   To stop the app, double-click Stop Discipleship App"
