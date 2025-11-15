# Quick Start Guide

## 1. Environment Setup

### Backend
1. Copy `backend/env.template` to `backend/.env`
2. Edit `backend/.env` and update:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Generate a secure key (see below)

### Frontend
1. Copy `frontend/env.template` to `frontend/.env`
2. For local development, defaults should work fine

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 3. Start Development Servers

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## 4. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## Need Help?

See `ENV_SETUP_INSTRUCTIONS.md` for detailed environment variable setup.

