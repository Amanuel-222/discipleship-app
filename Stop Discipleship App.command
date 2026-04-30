#!/bin/bash

# ── Discipleship App Stopper ──
# Kills the server and client processes

APP_DIR="$HOME/Downloads/discipleship-app"

# Kill server
if [ -f "$APP_DIR/.server.pid" ]; then
  SERVER_PID=$(cat "$APP_DIR/.server.pid")
  kill $SERVER_PID 2>/dev/null
  pkill -f "nodemon index.js" 2>/dev/null
  rm "$APP_DIR/.server.pid"
  echo "🛑 Server stopped"
fi

# Kill client
if [ -f "$APP_DIR/.client.pid" ]; then
  CLIENT_PID=$(cat "$APP_DIR/.client.pid")
  kill $CLIENT_PID 2>/dev/null
  pkill -f "react-scripts start" 2>/dev/null
  rm "$APP_DIR/.client.pid"
  echo "🛑 Client stopped"
fi

echo ""
echo "✅ Discipleship App stopped."
