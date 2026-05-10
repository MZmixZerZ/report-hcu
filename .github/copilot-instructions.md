# Project Setup Instructions for Report HCU

This is a full-stack application with React frontend and Node.js Express backend.

## Project Overview
- **Frontend**: React 18 with axios for API calls
- **Backend**: Node.js Express server with CORS support
- **Structure**: `client/` for frontend, `server/` for backend

## Installation Steps

### Backend
```bash
cd server
npm install
npm run dev
```
Runs on `http://localhost:5000`

### Frontend
```bash
cd client
npm install
npm start
```
Runs on `http://localhost:3000`

## Key Files
- Backend: `server/server.js` - Main Express server
- Frontend: `client/src/App.js` - Main React component
- Config: `.env` files in each directory

## Running the Application
- Terminal 1: `cd server && npm run dev`
- Terminal 2: `cd client && npm start`

The application will be available at `http://localhost:3000`
