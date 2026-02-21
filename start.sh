#!/bin/bash
# Xcellent — Start script
# Builds UI and starts the server

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Xcellent — Starting..."

# Install dependencies if needed
if [ ! -d "$DIR/server/node_modules" ]; then
  echo "📦 Installing server dependencies..."
  cd "$DIR/server" && npm install
fi

if [ ! -d "$DIR/ui/node_modules" ]; then
  echo "📦 Installing UI dependencies..."
  cd "$DIR/ui" && npm install
fi

# Build UI
echo "🔨 Building UI..."
cd "$DIR/ui" && npx vite build --silent 2>/dev/null

# Start server (serves built UI + API)
echo ""
cd "$DIR/server" && node index.js
