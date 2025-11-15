# Render Deployment Guide

## Common Login Issues After Deployment

If you're unable to login after deploying to Render, check the following:

## 1. Environment Variables Setup

### Backend Environment Variables (in Render Dashboard)

Go to your backend service → Environment → Add the following:

```env
PORT=10000
NODE_ENV=production
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_random_secret_key_here
JWT_EXPIRE=7d
FRONTEND_URL=https://your-frontend-app.onrender.com
```

**Important:**
- `JWT_SECRET` must be a strong random string. Generate one using:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `FRONTEND_URL` should be your frontend Render URL (e.g., `https://hirely-frontend.onrender.com`)
- `MONGODB_URI` should be your MongoDB Atlas connection string

### Frontend Environment Variables (in Render Dashboard)

Go to your frontend service → Environment → Add the following:

```env
VITE_API_URL=https://your-backend-app.onrender.com
VITE_SOCKET_URL=https://your-backend-app.onrender.com
```

**Important:**
- Replace `your-backend-app.onrender.com` with your actual backend Render URL
- Do NOT include `/api` in the URL - it's added automatically
- Example: If your backend is at `https://hirely-backend.onrender.com`, use that exact URL

## 2. CORS Configuration

The backend is now configured to:
- Allow requests from `FRONTEND_URL` in production
- Allow all origins in development

Make sure `FRONTEND_URL` matches your frontend Render URL exactly (including `https://`).

## 3. MongoDB Connection

### For MongoDB Atlas:
1. Ensure your Render server IP is whitelisted in MongoDB Atlas
2. Or use `0.0.0.0/0` to allow all IPs (less secure but easier for testing)
3. Check your connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/hirely?retryWrites=true&w=majority
   ```

## 4. Build Settings

### Backend Build Command:
```bash
npm install
```

### Backend Start Command:
```bash
npm start
```

### Frontend Build Command:
```bash
npm install && npm run build
```

### Frontend Start Command:
```bash
npm run preview
```

Or if using a static site:
```bash
npx serve -s dist -l 3000
```

## 5. Common Issues and Solutions

### Issue: "Invalid credentials" on login
**Solution:**
- Check that `JWT_SECRET` is set in backend environment variables
- Verify MongoDB connection is working
- Check backend logs in Render dashboard

### Issue: CORS errors in browser console
**Solution:**
- Verify `FRONTEND_URL` in backend matches your frontend URL exactly
- Check that both URLs use `https://` (not `http://`)
- Ensure no trailing slashes in URLs

### Issue: API requests failing (404 or network errors)
**Solution:**
- Verify `VITE_API_URL` in frontend environment variables
- Check that backend service is running (check logs)
- Ensure backend URL doesn't have `/api` at the end (it's added automatically)

### Issue: Socket.io connection failing
**Solution:**
- Verify `VITE_SOCKET_URL` matches your backend URL
- Check that Socket.io CORS is configured correctly
- Ensure WebSocket support is enabled in Render (usually automatic)

## 6. Testing Your Deployment

1. **Check Backend Health:**
   Visit: `https://your-backend.onrender.com/api/auth/me` (should return 401, not 404)

2. **Check Frontend:**
   Visit your frontend URL and check browser console for errors

3. **Test Login:**
   - Try logging in with existing credentials
   - Check browser Network tab for API requests
   - Verify requests go to correct backend URL

## 7. Debugging Steps

1. **Check Render Logs:**
   - Backend: Service → Logs
   - Frontend: Service → Logs

2. **Check Environment Variables:**
   - Verify all variables are set correctly
   - Check for typos in variable names
   - Ensure no extra spaces or quotes

3. **Test API Endpoints:**
   ```bash
   # Test login endpoint
   curl -X POST https://your-backend.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password"}'
   ```

4. **Check Browser Console:**
   - Open DevTools → Console
   - Look for CORS errors, network errors, or API errors
   - Check Network tab to see actual request URLs

## 8. Quick Checklist

- [ ] Backend `JWT_SECRET` is set and is a strong random string
- [ ] Backend `MONGODB_URI` is correct and accessible
- [ ] Backend `FRONTEND_URL` matches your frontend Render URL exactly
- [ ] Frontend `VITE_API_URL` matches your backend Render URL (without `/api`)
- [ ] Frontend `VITE_SOCKET_URL` matches your backend Render URL
- [ ] Both services are deployed and running
- [ ] MongoDB Atlas IP whitelist includes Render IPs
- [ ] All URLs use `https://` (not `http://`)

## 9. Example Configuration

### Backend Service (Render)
- **Name:** `hirely-backend`
- **URL:** `https://hirely-backend.onrender.com`
- **Environment Variables:**
  ```
  PORT=10000
  NODE_ENV=production
  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/hirely
  JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
  JWT_EXPIRE=7d
  FRONTEND_URL=https://hirely-frontend.onrender.com
  ```

### Frontend Service (Render)
- **Name:** `hirely-frontend`
- **URL:** `https://hirely-frontend.onrender.com`
- **Environment Variables:**
  ```
  VITE_API_URL=https://hirely-backend.onrender.com
  VITE_SOCKET_URL=https://hirely-backend.onrender.com
  ```

## Need Help?

If issues persist:
1. Check Render service logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test API endpoints directly using curl or Postman
4. Check browser console for client-side errors

