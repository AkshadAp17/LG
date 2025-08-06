import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/legal_case_management';
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    console.log('Falling back to in-memory mode for development...');
    // Don't exit, allow the app to continue without database for basic testing
  }
};

// User Model
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['client', 'lawyer', 'police'], required: true },
  city: String,
  specialization: [String],
  experience: Number,
  policeStationCode: String,
  stats: {
    totalCases: { type: Number, default: 0 },
    wonCases: { type: Number, default: 0 },
    lostCases: { type: Number, default: 0 },
  },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

export const UserModel = mongoose.model('User', userSchema);

// Lawyer Model
const lawyerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialization: [String],
  city: { type: String, required: true },
  experience: { type: Number, required: true },
  rating: { type: Number, default: 0 },
  stats: {
    totalCases: { type: Number, default: 0 },
    wonCases: { type: Number, default: 0 },
    lostCases: { type: Number, default: 0 },
  },
  description: String,
  image: String,
}, { timestamps: true });

export const LawyerModel = mongoose.model('Lawyer', lawyerSchema);

// Case Model
const caseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  caseType: { type: String, enum: ['fraud', 'theft', 'murder', 'civil', 'corporate'], required: true },
  victim: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
  },
  accused: {
    name: { type: String, required: true },
    phone: String,
    address: String,
  },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  policeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation', required: true },
  city: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'], 
    default: 'submitted' 
  },
  pnr: String,
  hearingDate: Date,
  documents: [String],
}, { timestamps: true });

export const CaseModel = mongoose.model('Case', caseSchema);

// Police Station Model
const policeStationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
}, { timestamps: true });

export const PoliceStationModel = mongoose.model('PoliceStation', policeStationSchema);

// Message Model
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

export const MessageModel = mongoose.model('Message', messageSchema);

// Case Request Model (for client to lawyer communication)
const caseRequestSchema = new mongoose.Schema({
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Simplified fields - only basic info from client
  victimName: { type: String, required: true },
  accusedName: { type: String, required: true },
  clientPhone: { type: String, required: true },
  clientEmail: { type: String },
  documents: [String],
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  lawyerResponse: { type: String },
  
  // Optional detailed fields (filled by lawyer later)
  caseType: { type: String, enum: ['fraud', 'theft', 'murder', 'civil', 'corporate'] },
  victim: {
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  accused: {
    name: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  city: { type: String },
  policeStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'PoliceStation' },
}, { timestamps: true });

export const CaseRequestModel = mongoose.model('CaseRequest', caseRequestSchema);

// Notification Model
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['case_approved', 'case_rejected', 'hearing_scheduled', 'new_message', 'case_created', 'case_request'],
    required: true 
  },
  read: { type: Boolean, default: false },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  caseRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CaseRequest' },
}, { timestamps: true });

export const NotificationModel = mongoose.model('Notification', notificationSchema);

export default connectDB;
