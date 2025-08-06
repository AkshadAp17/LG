import { UserModel, LawyerModel, CaseModel, PoliceStationModel } from './db.js';
import bcrypt from 'bcrypt';

export const seedDatabase = async () => {
  try {
    // Check if data already exists
    const existingUsers = await UserModel.countDocuments();
    if (existingUsers > 0) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Create Police Stations
    const policeStations = [
      { name: 'Connaught Place', code: 'DEL-001', city: 'delhi', address: 'Connaught Place, New Delhi', phone: '+91-11-23341234', email: 'cp.delhi@police.gov.in' },
      { name: 'Karol Bagh', code: 'DEL-002', city: 'delhi', address: 'Karol Bagh, New Delhi', phone: '+91-11-25753456', email: 'kb.delhi@police.gov.in' },
      { name: 'Bandra', code: 'MUM-001', city: 'mumbai', address: 'Bandra West, Mumbai', phone: '+91-22-26421234', email: 'bandra.mumbai@police.gov.in' },
      { name: 'Andheri', code: 'MUM-002', city: 'mumbai', address: 'Andheri East, Mumbai', phone: '+91-22-26851234', email: 'andheri.mumbai@police.gov.in' },
      { name: 'Koramangala', code: 'BLR-001', city: 'bangalore', address: 'Koramangala, Bangalore', phone: '+91-80-25531234', email: 'koramangala.bangalore@police.gov.in' },
      { name: 'T Nagar', code: 'CHN-001', city: 'chennai', address: 'T Nagar, Chennai', phone: '+91-44-24331234', email: 'tnagar.chennai@police.gov.in' },
    ];

    await PoliceStationModel.insertMany(policeStations);

    // Create Lawyers
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const lawyers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@lawfirm.com',
        phone: '+91-9876543210',
        specialization: ['criminal', 'civil'],
        city: 'delhi',
        experience: 12,
        rating: 4.8,
        stats: { totalCases: 156, wonCases: 132, lostCases: 24 },
        description: 'Experienced criminal law attorney with expertise in fraud and theft cases.',
      },
      {
        name: 'Michael Chen',
        email: 'michael.chen@lawfirm.com',
        phone: '+91-9876543211',
        specialization: ['corporate', 'civil'],
        city: 'mumbai',
        experience: 8,
        rating: 4.6,
        stats: { totalCases: 89, wonCases: 82, lostCases: 7 },
        description: 'Corporate law specialist with focus on business disputes.',
      },
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@lawfirm.com',
        phone: '+91-9876543212',
        specialization: ['criminal', 'murder'],
        city: 'bangalore',
        experience: 15,
        rating: 4.9,
        stats: { totalCases: 203, wonCases: 189, lostCases: 14 },
        description: 'Senior criminal defense attorney specializing in serious crimes.',
      },
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@lawfirm.com',
        phone: '+91-9876543213',
        specialization: ['civil', 'property'],
        city: 'chennai',
        experience: 10,
        rating: 4.5,
        stats: { totalCases: 134, wonCases: 119, lostCases: 15 },
        description: 'Civil law expert with specialization in property disputes.',
      }
    ];

    await LawyerModel.insertMany(lawyers);

    // Create Users
    const users = [
      {
        name: 'John Smith',
        email: 'john.smith@email.com',
        password: hashedPassword,
        phone: '+91-9876543214',
        role: 'client',
        city: 'delhi',
      },
      {
        name: 'Alice Johnson',
        email: 'alice.johnson@email.com',
        password: hashedPassword,
        phone: '+91-9876543215',
        role: 'client',
        city: 'mumbai',
      },
      {
        name: 'Police Officer Delhi',
        email: 'officer.delhi@police.gov.in',
        password: hashedPassword,
        phone: '+91-11-23341234',
        role: 'police',
        policeStationCode: 'DEL-001',
      },
      {
        name: 'Police Officer Mumbai',
        email: 'officer.mumbai@police.gov.in',
        password: hashedPassword,
        phone: '+91-22-26421234',
        role: 'police',
        policeStationCode: 'MUM-001',
      }
    ];

    await UserModel.insertMany(users);

    // Create Sample Cases
    const delhiStation = await PoliceStationModel.findOne({ code: 'DEL-001' });
    const mumStation = await PoliceStationModel.findOne({ code: 'MUM-001' });
    const johnUser = await UserModel.findOne({ email: 'john.smith@email.com' });
    const aliceUser = await UserModel.findOne({ email: 'alice.johnson@email.com' });

    if (delhiStation && mumStation && johnUser && aliceUser) {
      const sampleCases = [
        {
          title: 'Property Dispute Case',
          description: 'Commercial property ownership dispute between two parties.',
          caseType: 'civil',
          victim: {
            name: 'Robert Anderson',
            phone: '+91-9876543220',
            email: 'robert.anderson@email.com',
          },
          accused: {
            name: 'Michael Thompson',
            phone: '+91-8765432109',
            address: '123 Business District, Delhi',
          },
          clientId: johnUser._id,
          policeStationId: delhiStation._id,
          city: 'delhi',
          status: 'under_review',
        },
        {
          title: 'Fraud Investigation',
          description: 'Financial fraud case involving unauthorized transactions.',
          caseType: 'fraud',
          victim: {
            name: 'Sarah Wilson',
            phone: '+91-9876543221',
            email: 'sarah.wilson@email.com',
          },
          accused: {
            name: 'David Brown',
            phone: '+91-8765432108',
            address: '456 Finance Street, Mumbai',
          },
          clientId: aliceUser._id,
          policeStationId: mumStation._id,
          city: 'mumbai',
          status: 'approved',
          pnr: 'PNR-2024-001235',
          hearingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
      ];

      await CaseModel.insertMany(sampleCases);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};
