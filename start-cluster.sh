#!/bin/bash

# 🟥 Function to kill all background jobs when you press Ctrl+C
cleanup() {
    echo -e "\n🛑 Shutting down all pharmacy services..."
    kill $(jobs -p)
    exit
}
trap cleanup SIGINT

echo "🚀 Starting the Decentralized Pharmacy Cluster..."

BASE_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"

# 1. Start Main Aggregator Platform (Port 3000)
echo "⚡ Starting Central Aggregator..."
cd "$BASE_DIR/backend/main-api" && npm run dev &
cd "$BASE_DIR"

# 2. Start Pharmacy API 1 (Port 3001)
echo "🏥 Starting Pharmacy Node 1..."
cd "$BASE_DIR/backend/api1" && npm run dev &
cd "$BASE_DIR"

# 3. Start Pharmacy API 2 (Port 3002)
echo "🏥 Starting Pharmacy Node 2..."
cd "$BASE_DIR/backend/api2" && npm run dev &
cd "$BASE_DIR"

# 4. Start Pharmacy API 3 (Port 3003)
echo "🏥 Starting Pharmacy Node 3..."
cd "$BASE_DIR/backend/api3" && npm run dev &
cd "$BASE_DIR"

echo "✅ All servers booting concurrently! Press Ctrl+C to stop everything safely."

# Keep the script running so trap can catch the Ctrl+C
wait