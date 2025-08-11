# Legal Case Management System - Deployment Guide

## Quick Deploy to Render

This application is ready for deployment on Render with all necessary configuration files included.

### 1. Prerequisites Setup

Before deploying, you'll need accounts for these services:

**MongoDB Atlas** (Database)
- Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Create a new cluster
- Get your connection string

**Cloudinary** (File Storage) 
- Sign up at [Cloudinary](https://cloudinary.com/)
- Get your cloud name, API key, and API secret from dashboard

**SendGrid** (Email Service)
- Sign up at [SendGrid](https://sendgrid.com/)
- Create an API key with mail sending permissions

### 2. Deploy to Render

**Option A: One-Click Deploy (Recommended)**
1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Render will automatically detect the `render.yaml` configuration
6. Set the environment variables (see below)
7. Click "Create Web Service"

**Option B: Manual Configuration**
1. Create a new Web Service on Render
2. Connect your repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add environment variables

### 3. Environment Variables

Set these in your Render service settings:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/legal-case-management
JWT_SECRET=[Generate random string]
SESSION_SECRET=[Generate random string]
SENDGRID_API_KEY=your-sendgrid-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Post-Deployment

After deployment:
1. Your app will be available at: `https://your-app-name.onrender.com`
2. Database will be automatically seeded with sample data
3. You can log in with sample accounts:
   - Client: `alice.client@example.com` / `password123`
   - Lawyer: `john.lawyer@example.com` / `password123`
   - Police: `officer.police@example.com` / `password123`

### 5. Features Included

✅ Full-stack React + Node.js application  
✅ MongoDB database with automatic seeding  
✅ JWT authentication & sessions  
✅ File upload with Cloudinary  
✅ Email notifications with SendGrid  
✅ Role-based access control  
✅ Real-time messaging system  
✅ Case management workflow  
✅ Document handling  
✅ Calendar integration  

### 6. Troubleshooting

**Build Failures:**
- Check that all environment variables are set
- Verify MongoDB connection string format
- Ensure repository has all required files

**Runtime Issues:**
- Check application logs in Render dashboard
- Verify external service credentials
- Test database connectivity

**File Upload Issues:**
- Confirm Cloudinary credentials are correct
- Check API key permissions

### 7. Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Express Sessions
- **File Storage**: Cloudinary
- **Email**: SendGrid
- **Build**: Vite + ESBuild
- **Deployment**: Render (Node.js runtime)

The application is production-ready with proper error handling, security measures, and scalable architecture.