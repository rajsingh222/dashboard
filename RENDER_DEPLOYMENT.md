# Dashboard SPPL Backend - Deployment Instructions

## Deploying to Render

### Prerequisites
1. MongoDB Atlas account with a production database
2. Render account (https://render.com)

### Step-by-Step Deployment

#### 1. Prepare Your Repository
```bash
# Make sure all changes are committed
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### 2. Create New Web Service on Render
1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository: Dashboard-SPPL

#### 3. Configure Service Settings
- **Name**: dashboard-sppl-backend
- **Environment**: Node
- **Region**: Choose closest to your users
- **Branch**: main
- **Root Directory**: backend
- **Build Command**: `npm install`
- **Start Command**: `npm start`

#### 4. Set Environment Variables
Add these in the Render dashboard under "Environment":

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dashboard_sppl?retryWrites=true&w=majority
JWT_SECRET=your-very-secure-random-string-here
FRONTEND_URL=https://yourdomain.com
ADMIN_FRONTEND_URL=https://yourdomain.com/admin
```

**Important**: 
- Generate a strong JWT_SECRET: `openssl rand -base64 32`
- Get MONGODB_URI from MongoDB Atlas → Database → Connect → Connect your application
- Replace FRONTEND_URL with your actual Hostinger domain

#### 5. Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete (5-10 minutes)
3. Your backend will be available at: `https://dashboard-sppl-backend.onrender.com`

### Post-Deployment
1. Test health endpoint: `https://your-backend.onrender.com/health`
2. Update frontend .env.production with backend URL
3. Test API endpoints

### Troubleshooting
- Check Render logs for errors
- Verify all environment variables are set correctly
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0) or add Render's IPs
- Check CORS settings match your frontend domain

### Important Notes
- Free tier: Service sleeps after inactivity, first request may be slow
- Upgrade to paid tier for always-on service
- Set up auto-deploy from GitHub for continuous deployment
