// Production configuration
export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/legal-case-management',
  jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret-key',
  sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret-key',
  
  // Email configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },
  
  // Gmail configuration
  gmail: {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
  },
  
  // Cloudinary configuration
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  
  // CORS configuration for production
  cors: {
    origin: process.env.FRONTEND_URL || true,
    credentials: true,
  }
};

export const isDev = config.nodeEnv === 'development';
export const isProd = config.nodeEnv === 'production';