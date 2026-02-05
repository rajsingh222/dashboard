# Dashboard SPPL Backend API

Backend API for Dashboard SPPL with MongoDB integration, authentication, and role-based access control.

## Features

- ✅ RESTful API with Express.js
- ✅ MongoDB database with Mongoose
- ✅ JWT authentication with refresh tokens
- ✅ Role-based authorization (Admin, User, Engineer, Viewer)
- ✅ Password hashing with bcrypt
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Rate limiting
- ✅ CORS enabled
- ✅ Security headers with Helmet
- ✅ Request compression
- ✅ Admin panel endpoints

## Prerequisites

- Node.js v16 or higher
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

## Installation

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your configuration

5. Seed admin user:
```bash
npm run seed
```

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## Default Admin Credentials

After running the seed script:
- **Email:** admin@spplindia.org
- **Password:** Admin@123456

⚠️ **Important:** Change the password after first login!

## API Endpoints

### Authentication (`/api/auth`)
- `POST /signup` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user (Protected)
- `POST /logout` - Logout user (Protected)
- `POST /refresh` - Refresh access token
- `PUT /profile` - Update profile (Protected)
- `PUT /change-password` - Change password (Protected)

### Projects (`/api/projects`)
- `GET /` - Get all projects (Protected)
- `POST /` - Create project (Protected)
- `GET /:id` - Get project by ID (Protected)
- `PUT /:id` - Update project (Protected)
- `DELETE /:id` - Delete project (Protected)
- `POST /:id/team` - Add team member (Protected)

### Sensors (`/api/sensors`)
- `GET /` - Get all sensors (Protected)
- `POST /` - Create sensor (Protected)
- `GET /:id` - Get sensor by ID (Protected)
- `PUT /:id` - Update sensor (Protected)
- `DELETE /:id` - Delete sensor (Protected)
- `GET /:id/readings` - Get sensor readings (Protected)
- `POST /:id/readings` - Add sensor reading (Protected)
- `GET /project/:projectId/latest` - Get latest readings (Protected)

### Alerts (`/api/alerts`)
- `GET /` - Get alerts (Protected)
- `PUT /:id/acknowledge` - Acknowledge alert (Protected)
- `PUT /:id/resolve` - Resolve alert (Protected)
- `POST /:id/notes` - Add note to alert (Protected)

### Admin (`/api/admin`)
- `GET /dashboard/stats` - Get dashboard statistics (Admin only)
- `GET /system/health` - Get system health (Admin only)
- `GET /users` - Get all users (Admin only)
- `GET /users/:id` - Get user by ID (Admin only)
- `PUT /users/:id` - Update user (Admin only)
- `DELETE /users/:id` - Delete user (Admin only)
- `POST /create-admin` - Create admin user (Admin only)
- `GET /projects` - Get all projects (Admin only)
- `GET /sensors` - Get all sensors (Admin only)
- `GET /alerts` - Get all alerts (Admin only)

## Authentication

Include JWT token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles

1. **Admin** - Full access to all resources
2. **User** - Can manage own projects and sensors
3. **Engineer** - Can be added to projects as team member
4. **Viewer** - Read-only access to assigned projects

## Error Responses

All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Success Responses

All endpoints return consistent success responses:
```json
{
  "success": true,
  "data": { ... }
}
```

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

### User
- fullName, email, userName, password
- role: admin | user | engineer | viewer
- phoneNumber, address, idProofType, idProofNumber
- isActive, isEmailVerified, lastLogin

### Project
- projectName, projectId, description
- owner, ownerEmail, location, projectType
- status: planning | in-progress | completed | on-hold | cancelled
- drawings, reports, sensors, teamMembers

### Sensor
- sensorId, sensorName, sensorType
- project, location, specifications
- status: active | inactive | maintenance | faulty
- thresholds, currentReading

### SensorReading
- sensor, project, timestamp, value, unit
- quality, metadata, isAnomaly

### Alert
- project, sensor, alertType, severity
- status: active | acknowledged | resolved | dismissed
- message, notes

## Deployment

### Hostinger Deployment

1. Build and upload backend files
2. Set up Node.js application
3. Configure environment variables
4. Start the server

See `DEPLOYMENT.md` for detailed instructions.

## Security

- Passwords are hashed using bcrypt
- JWT tokens expire after 7 days
- Refresh tokens expire after 30 days
- Rate limiting on auth endpoints
- Helmet.js for security headers
- Input validation on all endpoints
- CORS configured for specific origins

## Support

For issues or questions, contact the development team.
