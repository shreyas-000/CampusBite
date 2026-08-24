#!/bin/bash

# Trap SIGINT (Ctrl+C) and kill all child processes
trap 'echo -e "\nStopping both servers..."; kill 0; exit 1' SIGINT

echo "Starting Backend Server (FastAPI)..."
cd backend
# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi
# Run uvicorn on api.index:app as per the entry point
uvicorn api.index:app --reload --port 8000 &
cd ..

echo "Starting Frontend Server (Vite)..."
cd frontend
npm run dev &
cd ..

echo "Both servers are running."
echo "Frontend is at http://localhost:5173"
echo "Backend is at http://localhost:8000"
echo "Press Ctrl+C to stop."

# Wait for background processes
wait
