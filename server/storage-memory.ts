import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { 
  type User, type InsertUser, type Lawyer, type InsertLawyer,
  type Case, type InsertCase, type PoliceStation, type InsertPoliceStation,
  type Message, type InsertMessage, type Notification, type InsertNotification,
  type CaseRequest, type InsertCaseRequest, type LoginData, type AuthResponse
} from "@shared/schema";
import { type IStorage } from "./storage.js";

// In-memory storage for development fallback
export class MemoryStorage implements IStorage {
  private users: User[] = [];
  private lawyers: Lawyer[] = [];
  private cases: Case[] = [];
  private policeStations: PoliceStation[] = [];
  private messages: Message[] = [];
  private notifications: Notification[] = [];
  private caseRequests: CaseRequest[] = [];
  private idCounter = 1;

  constructor() {
    this.seedData();
  }

  private generateId(): string {
    return (this.idCounter++).toString();
  }

  private seedData() {
    // Add some test data
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    this.users = [
      {
        _id: '1',
        name: 'Test Client',
        email: 'client@test.com',
        password: hashedPassword,
        phone: '1234567890',
        role: 'client',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '2', 
        name: 'Test Lawyer',
        email: 'lawyer@test.com',
        password: hashedPassword,
        phone: '0987654321',
        role: 'lawyer',
        city: 'Mumbai',
        specialization: ['civil', 'corporate'],
        experience: 5,
        rating: 4.5,
        stats: { totalCases: 10, wonCases: 8, lostCases: 2 },
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    this.policeStations = [
      {
        _id: '1',
        name: 'Central Police Station',
        code: 'CPS001',
        city: 'Mumbai',
        address: '123 Central Street, Mumbai',
        phone: '022-12345678',
        email: 'central@police.gov.in',
        createdAt: new Date(),
      }
    ];
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = this.users.find(u => u.email === data.email);
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

    return { user, token };
  }

  async register(userData: InsertUser): Promise<User> {
    const existingUser = this.users.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user: User = {
      _id: this.generateId(),
      ...userData,
      password: hashedPassword,
      stats: userData.stats || { totalCases: 0, wonCases: 0, lostCases: 0 },
      rating: userData.rating || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.push(user);
    console.log(`✅ New user registered: ${user.email} (ID: ${user._id})`);
    console.log(`Total users in memory: ${this.users.length}`);
    return user;
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.find(u => u._id === id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    this.users[index] = { ...this.users[index], ...data, updatedAt: new Date() };
    return this.users[index];
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return this.users.filter(u => u.role === role);
  }

  async getLawyers(filters?: { city?: string; caseType?: string }): Promise<Lawyer[]> {
    let result = this.users.filter(u => u.role === 'lawyer') as Lawyer[];
    
    if (filters?.city) {
      result = result.filter(l => l.city === filters.city);
    }
    
    return result;
  }

  async getLawyer(id: string): Promise<Lawyer | null> {
    const user = this.users.find(u => u._id === id && u.role === 'lawyer');
    return user as Lawyer || null;
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    const newLawyer: Lawyer = {
      _id: this.generateId(),
      ...lawyer,
      createdAt: new Date(),
    };
    this.lawyers.push(newLawyer);
    return newLawyer;
  }

  async getCases(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<Case[]> {
    let result = [...this.cases];
    
    if (filters?.clientId) {
      result = result.filter(c => c.clientId === filters.clientId);
    }
    if (filters?.lawyerId) {
      result = result.filter(c => c.lawyerId === filters.lawyerId);
    }
    if (filters?.status) {
      result = result.filter(c => c.status === filters.status);
    }
    
    return result;
  }

  async getCase(id: string): Promise<Case | null> {
    return this.cases.find(c => c._id === id) || null;
  }

  async createCase(caseData: InsertCase): Promise<Case> {
    const newCase: Case = {
      _id: this.generateId(),
      ...caseData,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.cases.push(newCase);
    return newCase;
  }

  async updateCase(id: string, data: Partial<Case>): Promise<Case | null> {
    const index = this.cases.findIndex(c => c._id === id);
    if (index === -1) return null;
    
    this.cases[index] = { ...this.cases[index], ...data, updatedAt: new Date() };
    return this.cases[index];
  }

  async getPoliceStations(city?: string): Promise<PoliceStation[]> {
    let result = [...this.policeStations];
    if (city) {
      result = result.filter(ps => ps.city === city);
    }
    return result;
  }

  async getPoliceStation(id: string): Promise<PoliceStation | null> {
    return this.policeStations.find(ps => ps._id === id) || null;
  }

  async getMessages(userId: string, otherUserId?: string): Promise<Message[]> {
    let result = this.messages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
    
    if (otherUserId) {
      result = result.filter(m => 
        (m.senderId === userId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === userId)
      );
    }
    
    return result.sort((a, b) => 
      (a.timestamp?.getTime() || 0) - (b.timestamp?.getTime() || 0)
    );
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      _id: this.generateId(),
      ...message,
      timestamp: new Date(),
      read: false,
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return this.notifications.filter(n => n.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      _id: this.generateId(),
      ...notification,
      read: false,
      createdAt: new Date(),
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    const index = this.notifications.findIndex(n => n._id === id);
    if (index !== -1) {
      this.notifications[index].read = true;
    }
  }

  async getCaseRequests(filters?: { clientId?: string; lawyerId?: string; status?: string }): Promise<CaseRequest[]> {
    let result = [...this.caseRequests];
    
    if (filters?.clientId) {
      result = result.filter(cr => cr.clientId === filters.clientId);
    }
    if (filters?.lawyerId) {
      result = result.filter(cr => cr.lawyerId === filters.lawyerId);
    }
    if (filters?.status) {
      result = result.filter(cr => cr.status === filters.status);
    }
    
    return result;
  }

  async getCaseRequest(id: string): Promise<CaseRequest | null> {
    return this.caseRequests.find(cr => cr._id === id) || null;
  }

  async createCaseRequest(caseRequest: InsertCaseRequest): Promise<CaseRequest> {
    const newCaseRequest: CaseRequest = {
      _id: this.generateId(),
      ...caseRequest,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.caseRequests.push(newCaseRequest);
    return newCaseRequest;
  }

  async updateCaseRequest(id: string, data: Partial<CaseRequest>): Promise<CaseRequest | null> {
    const index = this.caseRequests.findIndex(cr => cr._id === id);
    if (index === -1) return null;
    
    this.caseRequests[index] = { ...this.caseRequests[index], ...data, updatedAt: new Date() };
    return this.caseRequests[index];
  }
}