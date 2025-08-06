import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
  type User, type InsertUser, type Lawyer, type InsertLawyer,
  type Case, type InsertCase, type PoliceStation, type InsertPoliceStation,
  type Message, type InsertMessage, type Notification, type InsertNotification,
  type LoginData, type AuthResponse
} from "@shared/schema";
import { 
  UserModel, LawyerModel, CaseModel, PoliceStationModel, 
  MessageModel, NotificationModel 
} from "./db.js";

export interface IStorage {
  // Auth
  login(data: LoginData): Promise<AuthResponse>;
  register(user: InsertUser): Promise<User>;
  
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  getUsersByRole(role: string): Promise<User[]>;
  
  // Lawyers
  getLawyers(filters?: { city?: string; caseType?: string }): Promise<Lawyer[]>;
  getLawyer(id: string): Promise<Lawyer | null>;
  createLawyer(lawyer: InsertLawyer): Promise<Lawyer>;
  
  // Cases
  getCases(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<Case[]>;
  getCase(id: string): Promise<Case | null>;
  createCase(caseData: InsertCase): Promise<Case>;
  updateCase(id: string, data: Partial<Case>): Promise<Case | null>;
  
  // Police Stations
  getPoliceStations(city?: string): Promise<PoliceStation[]>;
  getPoliceStation(id: string): Promise<PoliceStation | null>;
  
  // Messages
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class MongoStorage implements IStorage {
  async login(data: LoginData): Promise<AuthResponse> {
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        password: user.password,
        phone: user.phone,
        role: user.role,
        city: user.city,
        specialization: user.specialization,
        experience: user.experience,
        policeStationCode: user.policeStationCode,
        stats: user.stats,
        rating: user.rating,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token
    };
  }

  async register(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new UserModel({
      ...userData,
      password: hashedPassword,
    });
    
    const savedUser = await user.save();
    return {
      _id: savedUser._id.toString(),
      name: savedUser.name,
      email: savedUser.email,
      password: savedUser.password,
      phone: savedUser.phone,
      role: savedUser.role,
      city: savedUser.city,
      specialization: savedUser.specialization,
      experience: savedUser.experience,
      policeStationCode: savedUser.policeStationCode,
      stats: savedUser.stats,
      rating: savedUser.rating,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }

  async getUser(id: string): Promise<User | null> {
    const user = await UserModel.findById(id);
    if (!user) return null;
    
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      role: user.role,
      city: user.city,
      specialization: user.specialization,
      experience: user.experience,
      policeStationCode: user.policeStationCode,
      stats: user.stats,
      rating: user.rating,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email });
    if (!user) return null;
    
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      role: user.role,
      city: user.city,
      specialization: user.specialization,
      experience: user.experience,
      policeStationCode: user.policeStationCode,
      stats: user.stats,
      rating: user.rating,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const user = await UserModel.findByIdAndUpdate(id, data, { new: true });
    if (!user) return null;
    
    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      role: user.role,
      city: user.city,
      specialization: user.specialization,
      experience: user.experience,
      policeStationCode: user.policeStationCode,
      stats: user.stats,
      rating: user.rating,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUsersByRole(role: string): Promise<User[]> {
    const users = await UserModel.find({ role });
    return users.map(user => ({
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      password: user.password,
      phone: user.phone,
      role: user.role,
      city: user.city,
      specialization: user.specialization,
      experience: user.experience,
      policeStationCode: user.policeStationCode,
      stats: user.stats,
      rating: user.rating,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  async getLawyers(filters?: { city?: string; caseType?: string }): Promise<Lawyer[]> {
    const query: any = { role: 'lawyer' };
    
    if (filters?.city) {
      query.city = filters.city;
    }
    
    if (filters?.caseType) {
      query.specialization = { $in: [filters.caseType] };
    }

    const lawyers = await UserModel.find(query);
    return lawyers.map(lawyer => ({
      _id: lawyer._id.toString(),
      name: lawyer.name,
      email: lawyer.email,
      phone: lawyer.phone,
      specialization: lawyer.specialization || [],
      city: lawyer.city || '',
      experience: lawyer.experience || 0,
      rating: lawyer.rating || 0,
      stats: lawyer.stats || { totalCases: 0, wonCases: 0, lostCases: 0 },
      createdAt: lawyer.createdAt,
    }));
  }

  async getLawyer(id: string): Promise<Lawyer | null> {
    const lawyer = await UserModel.findOne({ _id: id, role: 'lawyer' });
    if (!lawyer) return null;
    
    return {
      _id: lawyer._id.toString(),
      name: lawyer.name,
      email: lawyer.email,
      phone: lawyer.phone,
      specialization: lawyer.specialization || [],
      city: lawyer.city || '',
      experience: lawyer.experience || 0,
      rating: lawyer.rating || 0,
      stats: lawyer.stats || { totalCases: 0, wonCases: 0, lostCases: 0 },
      createdAt: lawyer.createdAt,
    };
  }

  async createLawyer(lawyerData: InsertLawyer): Promise<Lawyer> {
    const lawyer = new LawyerModel(lawyerData);
    const savedLawyer = await lawyer.save();
    
    return {
      _id: savedLawyer._id.toString(),
      name: savedLawyer.name,
      email: savedLawyer.email,
      phone: savedLawyer.phone,
      specialization: savedLawyer.specialization,
      city: savedLawyer.city,
      experience: savedLawyer.experience,
      rating: savedLawyer.rating,
      stats: savedLawyer.stats,
      createdAt: savedLawyer.createdAt,
    };
  }

  // Cases implementation...
  async getCases(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<Case[]> {
    const query: any = {};
    
    if (filters?.clientId) query.clientId = filters.clientId;
    if (filters?.lawyerId) query.lawyerId = filters.lawyerId;
    if (filters?.status) query.status = filters.status;

    const cases = await CaseModel.find(query);
    return cases.map(case_ => ({
      _id: case_._id.toString(),
      title: case_.title,
      description: case_.description,
      caseType: case_.caseType,
      victim: case_.victim || { name: '', phone: '' },
      accused: case_.accused || { name: '' },
      clientId: case_.clientId,
      lawyerId: case_.lawyerId,
      policeStationId: case_.policeStationId,
      city: case_.city,
      status: case_.status,
      pnr: case_.pnr,
      hearingDate: case_.hearingDate,
      documents: case_.documents,
      createdAt: case_.createdAt,
      updatedAt: case_.updatedAt,
    }));
  }

  async getCase(id: string): Promise<Case | null> {
    const case_ = await CaseModel.findById(id);
    if (!case_) return null;
    
    return {
      _id: case_._id.toString(),
      title: case_.title,
      description: case_.description,
      caseType: case_.caseType,
      victim: case_.victim || { name: '', phone: '' },
      accused: case_.accused || { name: '' },
      clientId: case_.clientId,
      lawyerId: case_.lawyerId,
      policeStationId: case_.policeStationId,
      city: case_.city,
      status: case_.status,
      pnr: case_.pnr,
      hearingDate: case_.hearingDate,
      documents: case_.documents,
      createdAt: case_.createdAt,
      updatedAt: case_.updatedAt,
    };
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const case_ = new CaseModel(caseData);
    const savedCase = await case_.save();
    
    return {
      _id: savedCase._id.toString(),
      title: savedCase.title,
      description: savedCase.description,
      caseType: savedCase.caseType,
      victim: savedCase.victim || { name: '', phone: '' },
      accused: savedCase.accused || { name: '' },
      clientId: savedCase.clientId,
      lawyerId: savedCase.lawyerId,
      policeStationId: savedCase.policeStationId,
      city: savedCase.city,
      status: savedCase.status,
      pnr: savedCase.pnr,
      hearingDate: savedCase.hearingDate,
      documents: savedCase.documents,
      createdAt: savedCase.createdAt,
      updatedAt: savedCase.updatedAt,
    };
  }

  async updateCase(id: string, data: Partial<Case>): Promise<Case | null> {
    const case_ = await CaseModel.findByIdAndUpdate(id, data, { new: true });
    if (!case_) return null;
    
    return {
      _id: case_._id.toString(),
      title: case_.title,
      description: case_.description,
      caseType: case_.caseType,
      victim: case_.victim || { name: '', phone: '' },
      accused: case_.accused || { name: '' },
      clientId: case_.clientId,
      lawyerId: case_.lawyerId,
      policeStationId: case_.policeStationId,
      city: case_.city,
      status: case_.status,
      pnr: case_.pnr,
      hearingDate: case_.hearingDate,
      documents: case_.documents,
      createdAt: case_.createdAt,
      updatedAt: case_.updatedAt,
    };
  }

  async getPoliceStations(city?: string): Promise<PoliceStation[]> {
    const query: any = {};
    if (city) query.city = city;

    const stations = await PoliceStationModel.find(query);
    return stations.map(station => ({
      _id: station._id.toString(),
      name: station.name,
      code: station.code,
      city: station.city,
      address: station.address,
      phone: station.phone,
      email: station.email,
      createdAt: station.createdAt,
    }));
  }

  async getPoliceStation(id: string): Promise<PoliceStation | null> {
    const station = await PoliceStationModel.findById(id);
    if (!station) return null;
    
    return {
      _id: station._id.toString(),
      name: station.name,
      code: station.code,
      city: station.city,
      address: station.address,
      phone: station.phone,
      email: station.email,
      createdAt: station.createdAt,
    };
  }

  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    const query: any = {
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    };
    
    if (otherUserId) {
      query.$or = [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId }
      ];
    }

    const messages = await MessageModel.find(query).sort({ timestamp: 1 });
    return messages.map(msg => ({
      _id: msg._id.toString(),
      senderId: msg.senderId,
      receiverId: msg.receiverId,
      caseId: msg.caseId,
      content: msg.content,
      timestamp: msg.timestamp,
      read: msg.read,
    }));
  }

  async createMessage(messageData: InsertMessage): Promise<Message> {
    const message = new MessageModel({
      ...messageData,
      timestamp: new Date(),
      read: false,
    });
    
    const savedMessage = await message.save();
    return {
      _id: savedMessage._id.toString(),
      senderId: savedMessage.senderId,
      receiverId: savedMessage.receiverId,
      caseId: savedMessage.caseId,
      content: savedMessage.content,
      timestamp: savedMessage.timestamp,
      read: savedMessage.read,
    };
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    return notifications.map(notif => ({
      _id: notif._id.toString(),
      userId: notif.userId,
      title: notif.title,
      message: notif.message,
      type: notif.type,
      read: notif.read,
      caseId: notif.caseId,
      createdAt: notif.createdAt,
    }));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const notification = new NotificationModel({
      ...notificationData,
      read: false,
      createdAt: new Date(),
    });
    
    const savedNotification = await notification.save();
    return {
      _id: savedNotification._id.toString(),
      userId: savedNotification.userId,
      title: savedNotification.title,
      message: savedNotification.message,
      type: savedNotification.type,
      read: savedNotification.read,
      caseId: savedNotification.caseId,
      createdAt: savedNotification.createdAt,
    };
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await NotificationModel.findByIdAndUpdate(id, { read: true });
  }
}

export const storage = new MongoStorage();