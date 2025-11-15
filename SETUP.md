# Environment Setup Guide

## Quick Setup

Run the setup script to create `.env` files from examples:

```bash
# Windows
setup-env.bat

# Or manually copy the files
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

## Backend Environment Variables

Create `backend/.env` file with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/hirely

# For MongoDB Atlas (replace with your connection string):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hirely

# JWT Configuration
# IMPORTANT: Generate a strong random string for production
# You can generate one using Node.js:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_a_strong_random_string
JWT_EXPIRE=7d

# Frontend URL (for CORS and Socket.io)
FRONTEND_URL=http://localhost:5173
```

### Generating a Secure JWT Secret

Run this command to generate a secure random JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET` value.

## Frontend Environment Variables

Create `frontend/.env` file with the following:

```env
# API Configuration
# Backend API URL - used for Socket.io connection
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Note**: For local development, these defaults should work. In production, update these to match your deployed backend URL.

## Production Configuration

### Backend Production .env

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_production_mongodb_connection_string
JWT_SECRET=your_strong_production_secret_key
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Production .env

```env
VITE_API_URL=https://your-backend-api.com
VITE_SOCKET_URL=https://your-backend-api.com
```

## Important Security Notes

1. **Never commit `.env` files** - They are already in `.gitignore`
2. **Use strong JWT secrets** - Generate random strings for production
3. **Use HTTPS in production** - Update URLs accordingly
4. **Keep secrets secure** - Don't share `.env` files publicly

## Troubleshooting

### MongoDB Connection Issues

- **Local MongoDB**: Ensure MongoDB is running and the connection string is correct
- **MongoDB Atlas**: 
  - Check your IP is whitelisted
  - Verify username and password are correct
  - Ensure the database name matches

### Socket.io Connection Issues

- Verify `VITE_SOCKET_URL` in frontend matches your backend URL
- Check CORS settings in backend (`FRONTEND_URL`)
- Ensure both servers are running

### Environment Variables Not Loading

- **Backend**: Ensure `dotenv` is configured and `.env` is in the backend root
- **Frontend**: Vite requires `VITE_` prefix for variables to be exposed to client code

