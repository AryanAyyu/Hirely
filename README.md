# Hirely - Job Portal

A full-stack job portal application built with React, Node.js, Express, MongoDB, and Socket.io.

## Features

- **User Authentication**: JWT-based login/signup with role-based access (Job Seeker, Employer, Admin)
- **Job Management**: Create, update, delete job postings with filters and pagination
- **Application System**: Apply for jobs with resume upload and track application status
- **Real-Time Features**: Socket.io for notifications and chat between employers and job seekers
- **Dashboards**: Role-specific dashboards for managing jobs, applications, and users
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Fully responsive UI built with Tailwind CSS

## Tech Stack

### Frontend
- React 18
- Vite
- React Router DOM
- Tailwind CSS
- Socket.io Client
- Axios

### Backend
- Node.js
- Express.js (ES6 modules)
- MongoDB with Mongoose
- Socket.io
- JWT Authentication
- Multer (file uploads)

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Edit the `.env` file with your configuration:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/hirely
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**Important**: 
- For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string
- Generate a strong JWT_SECRET for production (you can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (copy from `.env.example`):
```bash

```

4. Edit the `.env` file if needed (defaults work for local development):
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

**Note**: In production, update these URLs to match your deployed backend URL.

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `JWT_EXPIRE` - JWT token expiration (default: 7d)
- `FRONTEND_URL` - Frontend URL for CORS (default: http://localhost:5173)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000)
- `VITE_SOCKET_URL` - Socket.io server URL (default: http://localhost:5000)

**Note**: Vite requires the `VITE_` prefix for environment variables to be exposed to the client.

## Project Structure

```
Hirely/
├── backend/
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, error handling, upload
│   ├── socket/          # Socket.io configuration
│   ├── utils/           # Utility functions
│   ├── uploads/         # Uploaded files (resumes)
│   ├── .env             # Environment variables (create from .env.example)
│   ├── .env.example     # Example environment variables
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   ├── .env             # Environment variables (create from .env.example)
│   ├── .env.example      # Example environment variables
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Jobs
- `GET /api/jobs` - Get all jobs (with filters and pagination)
- `GET /api/jobs/:id` - Get single job
- `POST /api/jobs` - Create job (Employer/Admin)
- `PUT /api/jobs/:id` - Update job (Employer/Admin)
- `DELETE /api/jobs/:id` - Delete job (Employer/Admin)

### Applications
- `POST /api/applications` - Apply for job (Job Seeker)
- `GET /api/applications/my-applications` - Get user's applications
- `GET /api/applications/job/:jobId` - Get applications for a job (Employer)
- `PUT /api/applications/:id/status` - Update application status

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/block` - Block/unblock user
- `GET /api/admin/jobs` - Get all jobs
- `PUT /api/admin/jobs/:id/status` - Update job status
- `GET /api/admin/stats` - Get admin statistics

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `GET /api/chat/messages/:userId` - Get messages with a user

## Socket.io Events

### Client to Server
- `send_message` - Send a message
- `typing` - Typing indicator

### Server to Client
- `receive_message` - Receive a new message
- `new_application` - New application notification (Employer)
- `application_status_changed` - Application status update (Job Seeker)

## User Roles

1. **Job Seeker**: Browse jobs, apply for positions, manage applications, chat with employers
2. **Employer**: Post jobs, view applications, manage candidates, chat with job seekers
3. **Admin**: Manage users, approve/reject jobs, view analytics

## Features in Detail

### Job Browsing
- Advanced filters (skills, location, salary, job type)
- Pagination
- Search functionality
- Job details page

### Application Management
- Resume upload (PDF, Word)
- Cover letter
- Application status tracking
- Real-time status updates

### Real-Time Chat
- Private messaging between employers and job seekers
- Message history
- Unread message indicators
- Typing indicators

### Dark Mode
- Toggle between light and dark themes
- Preference saved in localStorage

## Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Update `MONGODB_URI` to your production database
4. Update `FRONTEND_URL` to your production frontend URL
5. Consider using environment variables from your hosting platform

### Frontend
1. Update `VITE_API_URL` and `VITE_SOCKET_URL` to your production backend URL
2. Build the project: `npm run build`
3. Deploy the `dist` folder to your hosting platform

## Security Notes

- Never commit `.env` files to version control
- Use strong, random JWT secrets in production
- Enable HTTPS in production
- Validate and sanitize all user inputs
- Implement rate limiting for API endpoints
- Use environment variables for all sensitive configuration

## License

MIT
