import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { 
  type User, type InsertUser, type Lawyer, type InsertLawyer,
  type Case, type InsertCase, type PoliceStation, type InsertPoliceStation,
  type Message, type InsertMessage, type Notification, type InsertNotification,
  type CaseRequest, type InsertCaseRequest, type LoginData, type AuthResponse
} from "@shared/schema";
import { 
  UserModel, LawyerModel, CaseModel, PoliceStationModel, 
  MessageModel, NotificationModel, CaseRequestModel 
} from "./db.js";
import { MemoryStorage } from "./storage-memory.js";

export interface IStorage {
  // Auth
  login(data: LoginData): Promise<AuthResponse>;
  register(user: InsertUser): Promise<User>;
  
  // Users
  getUser(id: string): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  getUsersByRole(role: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
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
  getAllPoliceStations(): Promise<PoliceStation[]>;
  getPoliceStation(id: string): Promise<PoliceStation | null>;
  
  // Messages
  getMessages(userId: string, otherUserId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteAllMessages(): Promise<void>;
  
  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  deleteReadNotifications(userId: string): Promise<void>;
  
  // Case Requests
  getCaseRequests(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<CaseRequest[]>;
  getCaseRequest(id: string): Promise<CaseRequest | null>;
  createCaseRequest(caseRequest: InsertCaseRequest): Promise<CaseRequest>;
  updateCaseRequest(id: string, data: Partial<CaseRequest>): Promise<CaseRequest | null>;
}

export class MongoStorage implements IStorage {
  private isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
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
        city: user.city || undefined,
        specialization: user.specialization || undefined,
        experience: user.experience || undefined,
        policeStationCode: user.policeStationCode || undefined,
        stats: user.stats || undefined,
        rating: user.rating || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token
    };
  }

  async register(userData: InsertUser): Promise<User> {
    // Auto-assign police station for police officers based on their city
    if (userData.role === 'police' && userData.city && !userData.policeStationCode) {
      const cityStations = await PoliceStationModel.find({ city: userData.city });
      if (cityStations.length > 0) {
        userData.policeStationCode = cityStations[0].code; // Assign first station in the city
      }
    }

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
      city: savedUser.city || undefined,
      specialization: savedUser.specialization || undefined,
      experience: savedUser.experience || undefined,
      policeStationCode: savedUser.policeStationCode || undefined,
      stats: savedUser.stats || undefined,
      rating: savedUser.rating || undefined,
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
      city: user.city || undefined,
      specialization: user.specialization || undefined,
      experience: user.experience || undefined,
      policeStationCode: user.policeStationCode || undefined,
      stats: user.stats || undefined,
      rating: user.rating || undefined,
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
      city: user.city || undefined,
      specialization: user.specialization || undefined,
      experience: user.experience || undefined,
      policeStationCode: user.policeStationCode || undefined,
      stats: user.stats || undefined,
      rating: user.rating || undefined,
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

  async getAllUsers(): Promise<User[]> {
    const users = await UserModel.find({});
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

    const cases = await CaseModel.find(query).populate('policeStationId');
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
      policeStation: case_.policeStationId ? {
        _id: (case_.policeStationId as any)._id?.toString(),
        name: (case_.policeStationId as any).name,
        code: (case_.policeStationId as any).code,
        city: (case_.policeStationId as any).city,
        address: (case_.policeStationId as any).address,
        phone: (case_.policeStationId as any).phone,
        email: (case_.policeStationId as any).email,
      } : undefined,
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
    const case_ = await CaseModel.findById(id).populate('policeStationId');
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
      policeStation: case_.policeStationId ? {
        _id: (case_.policeStationId as any)._id?.toString(),
        name: (case_.policeStationId as any).name,
        code: (case_.policeStationId as any).code,
        city: (case_.policeStationId as any).city,
        address: (case_.policeStationId as any).address,
        phone: (case_.policeStationId as any).phone,
        email: (case_.policeStationId as any).email,
      } : undefined,
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
    // Set default status to under_review if not specified
    const caseWithStatus = {
      ...caseData,
      status: caseData.status || 'under_review' as const
    };
    const case_ = new CaseModel(caseWithStatus);
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

  async getAllPoliceStations(): Promise<PoliceStation[]> {
    const stations = await PoliceStationModel.find({});
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

  async deleteAllMessages(): Promise<void> {
    await MessageModel.deleteMany({});
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

  async deleteReadNotifications(userId: string): Promise<void> {
    await NotificationModel.deleteMany({ userId, read: true });
  }

  async getCaseRequests(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<CaseRequest[]> {
    const query: any = {};
    
    if (filters?.clientId) query.clientId = filters.clientId;
    if (filters?.lawyerId) query.lawyerId = filters.lawyerId;
    if (filters?.status) query.status = filters.status;

    const requests = await CaseRequestModel.find(query).sort({ createdAt: -1 });
    return requests.map(req => ({
      _id: req._id.toString(),
      clientId: req.clientId,
      lawyerId: req.lawyerId,
      title: req.title,
      description: req.description,
      victimName: req.victimName,
      accusedName: req.accusedName,
      clientPhone: req.clientPhone,
      clientEmail: req.clientEmail,
      caseType: req.caseType,
      victim: req.victim,
      accused: req.accused,
      city: req.city,
      policeStationId: req.policeStationId,
      documents: req.documents,
      status: req.status,
      lawyerResponse: req.lawyerResponse,
      createdAt: req.createdAt,
    }));
  }

  async getCaseRequest(id: string): Promise<CaseRequest | null> {
    const request = await CaseRequestModel.findById(id);
    if (!request) return null;
    
    return {
      _id: request._id.toString(),
      clientId: request.clientId,
      lawyerId: request.lawyerId,
      title: request.title,
      description: request.description,
      victimName: request.victimName,
      accusedName: request.accusedName,
      clientPhone: request.clientPhone,
      clientEmail: request.clientEmail,
      caseType: request.caseType,
      victim: request.victim,
      accused: request.accused,
      city: request.city,
      policeStationId: request.policeStationId,
      documents: request.documents,
      status: request.status,
      lawyerResponse: request.lawyerResponse,
      createdAt: request.createdAt,
    };
  }

  async createCaseRequest(requestData: InsertCaseRequest): Promise<CaseRequest> {
    const request = new CaseRequestModel({
      ...requestData,
      status: 'pending',
      createdAt: new Date(),
    });
    
    const savedRequest = await request.save();
    return {
      _id: savedRequest._id.toString(),
      clientId: savedRequest.clientId,
      lawyerId: savedRequest.lawyerId,
      title: savedRequest.title,
      description: savedRequest.description,
      victimName: savedRequest.victimName,
      accusedName: savedRequest.accusedName,
      clientPhone: savedRequest.clientPhone,
      clientEmail: savedRequest.clientEmail,
      caseType: savedRequest.caseType,
      victim: savedRequest.victim,
      accused: savedRequest.accused,
      city: savedRequest.city,
      policeStationId: savedRequest.policeStationId,
      documents: savedRequest.documents,
      status: savedRequest.status,
      lawyerResponse: savedRequest.lawyerResponse,
      createdAt: savedRequest.createdAt,
    };
  }

  async updateCaseRequest(id: string, data: Partial<CaseRequest>): Promise<CaseRequest | null> {
    const request = await CaseRequestModel.findByIdAndUpdate(id, data, { new: true });
    if (!request) return null;
    
    return {
      _id: request._id.toString(),
      clientId: request.clientId,
      lawyerId: request.lawyerId,
      title: request.title,
      description: request.description,
      victimName: request.victimName,
      accusedName: request.accusedName,
      clientPhone: request.clientPhone,
      clientEmail: request.clientEmail,
      caseType: request.caseType,
      victim: request.victim,
      accused: request.accused,
      city: request.city,
      policeStationId: request.policeStationId,
      documents: request.documents,
      status: request.status,
      lawyerResponse: request.lawyerResponse,
      createdAt: request.createdAt,
    };
  }
}

// Storage instance that dynamically switches based on MongoDB connection
class StorageManager implements IStorage {
  private mongoStorage = new MongoStorage();
  private memoryStorage = new MemoryStorage();

  private getStorage(): IStorage {
    return mongoose.connection.readyState === 1 ? this.mongoStorage : this.memoryStorage;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    return this.getStorage().login(data);
  }

  async register(user: InsertUser): Promise<User> {
    return this.getStorage().register(user);
  }

  async getUser(id: string): Promise<User | null> {
    return this.getStorage().getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.getStorage().getUserByEmail(email);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    return this.getStorage().updateUser(id, data);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.getStorage().getUsersByRole(role);
  }

  async getAllUsers(): Promise<User[]> {
    return this.getStorage().getAllUsers();
  }

  async getLawyers(filters?: { city?: string; caseType?: string }): Promise<Lawyer[]> {
    return this.getStorage().getLawyers(filters);
  }

  async getLawyer(id: string): Promise<Lawyer | null> {
    return this.getStorage().getLawyer(id);
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    return this.getStorage().createLawyer(lawyer);
  }

  async getCases(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<Case[]> {
    return this.getStorage().getCases(filters);
  }

  async getCase(id: string): Promise<Case | null> {
    return this.getStorage().getCase(id);
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    return this.getStorage().createCase(caseData);
  }

  async updateCase(id: string, data: Partial<Case>): Promise<Case | null> {
    return this.getStorage().updateCase(id, data);
  }

  async getPoliceStations(city?: string): Promise<PoliceStation[]> {
    return this.getStorage().getPoliceStations(city);
  }

  async getAllPoliceStations(): Promise<PoliceStation[]> {
    return this.getStorage().getAllPoliceStations();
  }

  async getPoliceStation(id: string): Promise<PoliceStation | null> {
    return this.getStorage().getPoliceStation(id);
  }

  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    return this.getStorage().getMessages(userId, otherUserId);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    return this.getStorage().createMessage(message);
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.getStorage().getNotifications(userId);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    return this.getStorage().createNotification(notification);
  }

  async markNotificationAsRead(id: string): Promise<void> {
    return this.getStorage().markNotificationAsRead(id);
  }

  async deleteReadNotifications(userId: string): Promise<void> {
    return this.getStorage().deleteReadNotifications(userId);
  }

  async getCaseRequests(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<CaseRequest[]> {
    return this.getStorage().getCaseRequests(filters);
  }

  async getCaseRequest(id: string): Promise<CaseRequest | null> {
    return this.getStorage().getCaseRequest(id);
  }

  async createCaseRequest(caseRequest: InsertCaseRequest): Promise<CaseRequest> {
    return this.getStorage().createCaseRequest(caseRequest);
  }

  async updateCaseRequest(id: string, data: Partial<CaseRequest>): Promise<CaseRequest | null> {
    return this.getStorage().updateCaseRequest(id, data);
  }
}

export const storage = new StorageManager();