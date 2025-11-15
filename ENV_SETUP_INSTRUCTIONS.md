# Environment Variables Setup Instructions

## Quick Setup

### Option 1: Manual Creation (Recommended)

Create the following files manually:

### Backend `.env` File

Create `backend/.env` with the following content:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/hirely

# For MongoDB Atlas, use your connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hirely

# JWT Configuration
# IMPORTANT: Generate a strong random string for production
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_use_a_strong_random_string
JWT_EXPIRE=7d

# Frontend URL (for CORS and Socket.io)
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` File

Create `frontend/.env` with the following content:

```env
# API Configuration
# Backend API URL - used for Socket.io connection
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## Step-by-Step Instructions

### 1. Backend Setup

1. Navigate to the `backend` folder
2. Create a new file named `.env` (no extension, just `.env`)
3. Copy and paste the backend environment variables from above
4. **IMPORTANT**: 
   - Update `MONGODB_URI` with your MongoDB connection string
   - Generate a strong `JWT_SECRET` using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Replace the placeholder `JWT_SECRET` with the generated value

### 2. Frontend Setup

1. Navigate to the `frontend` folder
2. Create a new file named `.env` (no extension, just `.env`)
3. Copy and paste the frontend environment variables from above
4. For local development, the defaults should work fine
5. In production, update these URLs to match your deployed backend

## Environment Variables Explained

### Backend Variables

- **PORT**: The port your backend server will run on (default: 5000)
- **NODE_ENV**: Environment mode - `development` or `production`
- **MONGODB_URI**: Your MongoDB connection string
  - Local: `mongodb://localhost:27017/hirely`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/hirely`
- **JWT_SECRET**: Secret key for signing JWT tokens (MUST be changed in production!)
- **JWT_EXPIRE**: How long JWT tokens are valid (default: 7 days)
- **FRONTEND_URL**: Your frontend URL for CORS configuration

### Frontend Variables

- **VITE_API_URL**: Backend API URL (used by Axios)
- **VITE_SOCKET_URL**: Socket.io server URL (used for real-time features)

**Note**: Vite requires the `VITE_` prefix for environment variables to be exposed to client code.

## Production Configuration

### Backend Production `.env`

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_production_mongodb_connection_string
JWT_SECRET=your_strong_production_secret_key_generated_randomly
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend Production `.env`

```env
VITE_API_URL=https://your-backend-api.com
VITE_SOCKET_URL=https://your-backend-api.com
```

## Security Checklist

- [ ] Never commit `.env` files to version control (already in `.gitignore`)
- [ ] Use strong, randomly generated JWT secrets
- [ ] Use HTTPS in production
- [ ] Keep your MongoDB credentials secure
- [ ] Don't share `.env` files publicly

## Troubleshooting

### MongoDB Connection Issues

**Local MongoDB:**
- Ensure MongoDB is installed and running
- Check the connection string matches your MongoDB setup
- Default: `mongodb://localhost:27017/hirely`

**MongoDB Atlas:**
- Verify your IP address is whitelisted
- Check username and password are correct
- Ensure the database name is correct

### Socket.io Connection Issues

- Verify `VITE_SOCKET_URL` in frontend matches your backend URL
- Check CORS settings in backend (`FRONTEND_URL`)
- Ensure both servers are running
- Check browser console for connection errors

### Environment Variables Not Loading

**Backend:**
- Ensure `dotenv` package is installed
- Verify `.env` file is in the `backend` root directory
- Check file name is exactly `.env` (not `.env.txt`)

**Frontend:**
- Vite requires `VITE_` prefix for client-side variables
- Restart the dev server after changing `.env` files
- Variables are available via `import.meta.env.VITE_*`

## Verification

After creating the `.env` files:

1. **Backend**: Start the server - it should connect to MongoDB
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend**: Start the dev server - it should connect to the backend
   ```bash
   cd frontend
   npm run dev
   ```

If you see connection errors, double-check your environment variables.

