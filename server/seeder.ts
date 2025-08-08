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

    // Create Comprehensive Police Stations across Indian States
    const policeStations = [
      // Delhi
      { name: 'Connaught Place', code: 'DEL-001', city: 'delhi', address: 'Connaught Place, New Delhi', phone: '+91-11-23341234', email: 'cp.delhi@police.gov.in' },
      { name: 'Karol Bagh', code: 'DEL-002', city: 'delhi', address: 'Karol Bagh, New Delhi', phone: '+91-11-25753456', email: 'kb.delhi@police.gov.in' },
      { name: 'Rohini', code: 'DEL-003', city: 'delhi', address: 'Sector 7, Rohini, Delhi', phone: '+91-11-27051234', email: 'rohini.delhi@police.gov.in' },
      { name: 'Dwarka', code: 'DEL-004', city: 'delhi', address: 'Sector 10, Dwarka, Delhi', phone: '+91-11-25081234', email: 'dwarka.delhi@police.gov.in' },
      
      // Mumbai/Maharashtra
      { name: 'Bandra', code: 'MUM-001', city: 'mumbai', address: 'Bandra West, Mumbai', phone: '+91-22-26421234', email: 'bandra.mumbai@police.gov.in' },
      { name: 'Andheri', code: 'MUM-002', city: 'mumbai', address: 'Andheri East, Mumbai', phone: '+91-22-26851234', email: 'andheri.mumbai@police.gov.in' },
      { name: 'Colaba', code: 'MUM-003', city: 'mumbai', address: 'Colaba, Mumbai', phone: '+91-22-22151234', email: 'colaba.mumbai@police.gov.in' },
      { name: 'Thane', code: 'MAH-001', city: 'pune', address: 'Thane West, Maharashtra', phone: '+91-22-25331234', email: 'thane.maharashtra@police.gov.in' },
      { name: 'Pune City', code: 'PUN-001', city: 'pune', address: 'FC Road, Pune', phone: '+91-20-26051234', email: 'pune.maharashtra@police.gov.in' },
      { name: 'Nashik Road', code: 'NAS-001', city: 'nashik', address: 'Nashik Road, Nashik', phone: '+91-253-2451234', email: 'nashik.maharashtra@police.gov.in' },
      
      // Bangalore/Karnataka
      { name: 'Koramangala', code: 'BLR-001', city: 'bangalore', address: 'Koramangala, Bangalore', phone: '+91-80-25531234', email: 'koramangala.bangalore@police.gov.in' },
      { name: 'Whitefield', code: 'BLR-002', city: 'bangalore', address: 'Whitefield, Bangalore', phone: '+91-80-28451234', email: 'whitefield.bangalore@police.gov.in' },
      { name: 'MG Road', code: 'BLR-003', city: 'bangalore', address: 'MG Road, Bangalore', phone: '+91-80-25581234', email: 'mgroad.bangalore@police.gov.in' },
      { name: 'Mysore Palace', code: 'MYS-001', city: 'mysore', address: 'Mysore Palace Road, Mysore', phone: '+91-821-2421234', email: 'mysore.karnataka@police.gov.in' },
      
      // Chennai/Tamil Nadu
      { name: 'T Nagar', code: 'CHN-001', city: 'chennai', address: 'T Nagar, Chennai', phone: '+91-44-24331234', email: 'tnagar.chennai@police.gov.in' },
      { name: 'Anna Nagar', code: 'CHN-002', city: 'chennai', address: 'Anna Nagar, Chennai', phone: '+91-44-26151234', email: 'annanagar.chennai@police.gov.in' },
      { name: 'Velachery', code: 'CHN-003', city: 'chennai', address: 'Velachery, Chennai', phone: '+91-44-22351234', email: 'velachery.chennai@police.gov.in' },
      { name: 'Coimbatore Town', code: 'COI-001', city: 'coimbatore', address: 'RS Puram, Coimbatore', phone: '+91-422-2441234', email: 'coimbatore.tamilnadu@police.gov.in' },
      { name: 'Madurai Central', code: 'MAD-001', city: 'madurai', address: 'West Masi Street, Madurai', phone: '+91-452-2531234', email: 'madurai.tamilnadu@police.gov.in' },
      
      // Hyderabad/Telangana
      { name: 'Cyberabad', code: 'HYD-001', city: 'hyderabad', address: 'Gachibowli, Hyderabad', phone: '+91-40-27731234', email: 'cyberabad.hyderabad@police.gov.in' },
      { name: 'Secunderabad', code: 'HYD-002', city: 'hyderabad', address: 'SP Road, Secunderabad', phone: '+91-40-27801234', email: 'secunderabad.hyderabad@police.gov.in' },
      { name: 'Banjara Hills', code: 'HYD-003', city: 'hyderabad', address: 'Road No 12, Banjara Hills', phone: '+91-40-23551234', email: 'banjarahills.hyderabad@police.gov.in' },
      
      // Kolkata/West Bengal
      { name: 'Park Street', code: 'KOL-001', city: 'kolkata', address: 'Park Street, Kolkata', phone: '+91-33-22651234', email: 'parkstreet.kolkata@police.gov.in' },
      { name: 'Salt Lake', code: 'KOL-002', city: 'kolkata', address: 'Salt Lake City, Kolkata', phone: '+91-33-23351234', email: 'saltlake.kolkata@police.gov.in' },
      { name: 'Howrah', code: 'HOW-001', city: 'kolkata', address: 'Howrah Station Road, Howrah', phone: '+91-33-26651234', email: 'howrah.westbengal@police.gov.in' },
      
      // Ahmedabad/Gujarat
      { name: 'Ellis Bridge', code: 'AHM-001', city: 'ahmedabad', address: 'Ellis Bridge, Ahmedabad', phone: '+91-79-26581234', email: 'ellisbridge.ahmedabad@police.gov.in' },
      { name: 'Satellite', code: 'AHM-002', city: 'ahmedabad', address: 'Satellite Road, Ahmedabad', phone: '+91-79-26851234', email: 'satellite.ahmedabad@police.gov.in' },
      { name: 'Surat City', code: 'SUR-001', city: 'surat', address: 'Ring Road, Surat', phone: '+91-261-2651234', email: 'surat.gujarat@police.gov.in' },
      
      // Jaipur/Rajasthan
      { name: 'Civil Lines', code: 'JAI-001', city: 'jaipur', address: 'Civil Lines, Jaipur', phone: '+91-141-2651234', email: 'civillines.jaipur@police.gov.in' },
      { name: 'Malviya Nagar', code: 'JAI-002', city: 'jaipur', address: 'Malviya Nagar, Jaipur', phone: '+91-141-2751234', email: 'malviyanagar.jaipur@police.gov.in' },
      { name: 'Jodhpur Central', code: 'JOD-001', city: 'jodhpur', address: 'High Court Road, Jodhpur', phone: '+91-291-2651234', email: 'jodhpur.rajasthan@police.gov.in' },
      
      // Lucknow/Uttar Pradesh
      { name: 'Hazratganj', code: 'LUC-001', city: 'lucknow', address: 'Hazratganj, Lucknow', phone: '+91-522-2651234', email: 'hazratganj.lucknow@police.gov.in' },
      { name: 'Gomti Nagar', code: 'LUC-002', city: 'lucknow', address: 'Gomti Nagar, Lucknow', phone: '+91-522-2751234', email: 'gomtinagar.lucknow@police.gov.in' },
      { name: 'Varanasi Cantonment', code: 'VAR-001', city: 'varanasi', address: 'Cantonment, Varanasi', phone: '+91-542-2651234', email: 'varanasi.uttarpradesh@police.gov.in' },
      { name: 'Agra Cantt', code: 'AGR-001', city: 'agra', address: 'Cantt Area, Agra', phone: '+91-562-2651234', email: 'agra.uttarpradesh@police.gov.in' },
      
      // Chandigarh/Punjab/Haryana
      { name: 'Sector 17', code: 'CHD-001', city: 'chandigarh', address: 'Sector 17, Chandigarh', phone: '+91-172-2651234', email: 'sector17.chandigarh@police.gov.in' },
      { name: 'Mohali', code: 'MOH-001', city: 'mohali', address: 'Phase 7, Mohali', phone: '+91-172-2751234', email: 'mohali.punjab@police.gov.in' },
      { name: 'Ludhiana Central', code: 'LUD-001', city: 'ludhiana', address: 'Civil Lines, Ludhiana', phone: '+91-161-2651234', email: 'ludhiana.punjab@police.gov.in' },
      { name: 'Gurgaon Cyber City', code: 'GUR-001', city: 'gurgaon', address: 'Cyber City, Gurgaon', phone: '+91-124-2651234', email: 'gurgaon.haryana@police.gov.in' },
      
      // Bhubaneswar/Odisha
      { name: 'Bhubaneswar Capital', code: 'BBR-001', city: 'bhubaneswar', address: 'Unit 3, Bhubaneswar', phone: '+91-674-2651234', email: 'bhubaneswar.odisha@police.gov.in' },
      { name: 'Cuttack Sadar', code: 'CUT-001', city: 'cuttack', address: 'Link Road, Cuttack', phone: '+91-671-2651234', email: 'cuttack.odisha@police.gov.in' },
      
      // Kochi/Kerala
      { name: 'Ernakulam South', code: 'KOC-001', city: 'kochi', address: 'MG Road, Ernakulam', phone: '+91-484-2651234', email: 'ernakulam.kochi@police.gov.in' },
      { name: 'Fort Kochi', code: 'KOC-002', city: 'kochi', address: 'Fort Kochi, Kochi', phone: '+91-484-2751234', email: 'fortkochi.kerala@police.gov.in' },
      { name: 'Thiruvananthapuram Central', code: 'TVM-001', city: 'thiruvananthapuram', address: 'Museum Road, Trivandrum', phone: '+91-471-2651234', email: 'trivandrum.kerala@police.gov.in' },
      
      // Guwahati/Assam & Northeast
      { name: 'Pan Bazaar', code: 'GUW-001', city: 'guwahati', address: 'Pan Bazaar, Guwahati', phone: '+91-361-2651234', email: 'panbazaar.guwahati@police.gov.in' },
      { name: 'Dispur', code: 'GUW-002', city: 'guwahati', address: 'Dispur, Guwahati', phone: '+91-361-2751234', email: 'dispur.assam@police.gov.in' },
      { name: 'Imphal East', code: 'IMP-001', city: 'imphal', address: 'Thangal Bazaar, Imphal', phone: '+91-385-2651234', email: 'imphal.manipur@police.gov.in' },
      
      // Indore/Madhya Pradesh
      { name: 'Vijay Nagar', code: 'IND-001', city: 'indore', address: 'Vijay Nagar, Indore', phone: '+91-731-2651234', email: 'vijaynagar.indore@police.gov.in' },
      { name: 'Bhopal MP Nagar', code: 'BHO-001', city: 'bhopal', address: 'MP Nagar, Bhopal', phone: '+91-755-2651234', email: 'mpnagar.bhopal@police.gov.in' },
      
      // Patna/Bihar
      { name: 'Boring Road', code: 'PAT-001', city: 'patna', address: 'Boring Road, Patna', phone: '+91-612-2651234', email: 'boringroad.patna@police.gov.in' },
      { name: 'Gandhi Maidan', code: 'PAT-002', city: 'patna', address: 'Gandhi Maidan, Patna', phone: '+91-612-2751234', email: 'gandhimaidan.bihar@police.gov.in' },
      
      // Dehradun/Uttarakhand
      { name: 'Clock Tower', code: 'DEH-001', city: 'dehradun', address: 'Clock Tower, Dehradun', phone: '+91-135-2651234', email: 'clocktower.dehradun@police.gov.in' },
      { name: 'Haridwar', code: 'HAR-001', city: 'haridwar', address: 'Railway Road, Haridwar', phone: '+91-1334-651234', email: 'haridwar.uttarakhand@police.gov.in' },
      
      // Raipur/Chhattisgarh
      { name: 'Civil Lines', code: 'RAI-001', city: 'raipur', address: 'Civil Lines, Raipur', phone: '+91-771-2651234', email: 'civillines.raipur@police.gov.in' },
      
      // Ranchi/Jharkhand
      { name: 'Main Road', code: 'RAN-001', city: 'ranchi', address: 'Main Road, Ranchi', phone: '+91-651-2651234', email: 'mainroad.ranchi@police.gov.in' },
      
      // Shimla/Himachal Pradesh
      { name: 'The Mall', code: 'SHI-001', city: 'shimla', address: 'The Mall Road, Shimla', phone: '+91-177-2651234', email: 'themall.shimla@police.gov.in' },
      
      // Jammu/Jammu & Kashmir
      { name: 'Gandhi Nagar', code: 'JAM-001', city: 'jammu', address: 'Gandhi Nagar, Jammu', phone: '+91-191-2651234', email: 'gandhinagar.jammu@police.gov.in' },
      { name: 'Srinagar Dal Gate', code: 'SRI-001', city: 'srinagar', address: 'Dal Gate, Srinagar', phone: '+91-194-2651234', email: 'dalgate.srinagar@police.gov.in' },
      
      // Goa
      { name: 'Panaji', code: 'GOA-001', city: 'panaji', address: 'MG Road, Panaji', phone: '+91-832-2651234', email: 'panaji.goa@police.gov.in' },
      { name: 'Margao', code: 'GOA-002', city: 'margao', address: 'Station Road, Margao', phone: '+91-832-2751234', email: 'margao.goa@police.gov.in' },
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

    // Create Users (including comprehensive police officers for all stations)
    const users = [
      // Client Users
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
      
      // Police Officers for each station (using same emails as police station emails)
      // All police officers have password: password123
      
      // Delhi Police Officers
      { name: 'Officer CP Delhi', email: 'cp.delhi@police.gov.in', password: hashedPassword, phone: '+91-11-23341234', role: 'police', policeStationCode: 'DEL-001' },
      { name: 'Officer KB Delhi', email: 'kb.delhi@police.gov.in', password: hashedPassword, phone: '+91-11-25753456', role: 'police', policeStationCode: 'DEL-002' },
      { name: 'Officer Rohini', email: 'rohini.delhi@police.gov.in', password: hashedPassword, phone: '+91-11-27051234', role: 'police', policeStationCode: 'DEL-003' },
      { name: 'Officer Dwarka', email: 'dwarka.delhi@police.gov.in', password: hashedPassword, phone: '+91-11-25081234', role: 'police', policeStationCode: 'DEL-004' },
      
      // Mumbai/Maharashtra Police Officers  
      { name: 'Officer Bandra', email: 'bandra.mumbai@police.gov.in', password: hashedPassword, phone: '+91-22-26421234', role: 'police', policeStationCode: 'MUM-001' },
      { name: 'Officer Andheri', email: 'andheri.mumbai@police.gov.in', password: hashedPassword, phone: '+91-22-26851234', role: 'police', policeStationCode: 'MUM-002' },
      { name: 'Officer Colaba', email: 'colaba.mumbai@police.gov.in', password: hashedPassword, phone: '+91-22-22151234', role: 'police', policeStationCode: 'MUM-003' },
      { name: 'Officer Thane', email: 'thane.maharashtra@police.gov.in', password: hashedPassword, phone: '+91-22-25331234', role: 'police', policeStationCode: 'MAH-001' },
      { name: 'Officer Pune', email: 'pune.maharashtra@police.gov.in', password: hashedPassword, phone: '+91-20-26051234', role: 'police', policeStationCode: 'PUN-001' },
      { name: 'Officer Nashik', email: 'nashik.maharashtra@police.gov.in', password: hashedPassword, phone: '+91-253-2451234', role: 'police', policeStationCode: 'NAS-001' },
      
      // Bangalore/Karnataka Police Officers
      { name: 'Officer Koramangala', email: 'koramangala.bangalore@police.gov.in', password: hashedPassword, phone: '+91-80-25531234', role: 'police', policeStationCode: 'BLR-001' },
      { name: 'Officer Whitefield', email: 'whitefield.bangalore@police.gov.in', password: hashedPassword, phone: '+91-80-28451234', role: 'police', policeStationCode: 'BLR-002' },
      { name: 'Officer MG Road', email: 'mgroad.bangalore@police.gov.in', password: hashedPassword, phone: '+91-80-25581234', role: 'police', policeStationCode: 'BLR-003' },
      { name: 'Officer Mysore', email: 'mysore.karnataka@police.gov.in', password: hashedPassword, phone: '+91-821-2421234', role: 'police', policeStationCode: 'MYS-001' },
      
      // Chennai/Tamil Nadu Police Officers
      { name: 'Officer T Nagar', email: 'tnagar.chennai@police.gov.in', password: hashedPassword, phone: '+91-44-24331234', role: 'police', policeStationCode: 'CHN-001' },
      { name: 'Officer Anna Nagar', email: 'annanagar.chennai@police.gov.in', password: hashedPassword, phone: '+91-44-26151234', role: 'police', policeStationCode: 'CHN-002' },
      { name: 'Officer Velachery', email: 'velachery.chennai@police.gov.in', password: hashedPassword, phone: '+91-44-22351234', role: 'police', policeStationCode: 'CHN-003' },
      { name: 'Officer Coimbatore', email: 'coimbatore.tamilnadu@police.gov.in', password: hashedPassword, phone: '+91-422-2441234', role: 'police', policeStationCode: 'COI-001' },
      { name: 'Officer Madurai', email: 'madurai.tamilnadu@police.gov.in', password: hashedPassword, phone: '+91-452-2531234', role: 'police', policeStationCode: 'MAD-001' },
      
      // Hyderabad/Telangana Police Officers
      { name: 'Officer Cyberabad', email: 'cyberabad.hyderabad@police.gov.in', password: hashedPassword, phone: '+91-40-27731234', role: 'police', policeStationCode: 'HYD-001' },
      { name: 'Officer Secunderabad', email: 'secunderabad.hyderabad@police.gov.in', password: hashedPassword, phone: '+91-40-27801234', role: 'police', policeStationCode: 'HYD-002' },
      { name: 'Officer Banjara Hills', email: 'banjarahills.hyderabad@police.gov.in', password: hashedPassword, phone: '+91-40-23551234', role: 'police', policeStationCode: 'HYD-003' },
      
      // Kolkata/West Bengal Police Officers
      { name: 'Officer Park Street', email: 'parkstreet.kolkata@police.gov.in', password: hashedPassword, phone: '+91-33-22651234', role: 'police', policeStationCode: 'KOL-001' },
      { name: 'Officer Salt Lake', email: 'saltlake.kolkata@police.gov.in', password: hashedPassword, phone: '+91-33-23351234', role: 'police', policeStationCode: 'KOL-002' },
      { name: 'Officer Howrah', email: 'howrah.westbengal@police.gov.in', password: hashedPassword, phone: '+91-33-26651234', role: 'police', policeStationCode: 'HOW-001' },
      
      // Ahmedabad/Gujarat Police Officers
      { name: 'Officer Ellis Bridge', email: 'ellisbridge.ahmedabad@police.gov.in', password: hashedPassword, phone: '+91-79-26581234', role: 'police', policeStationCode: 'AHM-001' },
      { name: 'Officer Satellite', email: 'satellite.ahmedabad@police.gov.in', password: hashedPassword, phone: '+91-79-26851234', role: 'police', policeStationCode: 'AHM-002' },
      { name: 'Officer Surat', email: 'surat.gujarat@police.gov.in', password: hashedPassword, phone: '+91-261-2651234', role: 'police', policeStationCode: 'SUR-001' },
      
      // Jaipur/Rajasthan Police Officers
      { name: 'Officer Civil Lines Jaipur', email: 'civillines.jaipur@police.gov.in', password: hashedPassword, phone: '+91-141-2651234', role: 'police', policeStationCode: 'JAI-001' },
      { name: 'Officer Malviya Nagar', email: 'malviyanagar.jaipur@police.gov.in', password: hashedPassword, phone: '+91-141-2751234', role: 'police', policeStationCode: 'JAI-002' },
      { name: 'Officer Jodhpur', email: 'jodhpur.rajasthan@police.gov.in', password: hashedPassword, phone: '+91-291-2651234', role: 'police', policeStationCode: 'JOD-001' },
      
      // Lucknow/Uttar Pradesh Police Officers
      { name: 'Officer Hazratganj', email: 'hazratganj.lucknow@police.gov.in', password: hashedPassword, phone: '+91-522-2651234', role: 'police', policeStationCode: 'LUC-001' },
      { name: 'Officer Gomti Nagar', email: 'gomtinagar.lucknow@police.gov.in', password: hashedPassword, phone: '+91-522-2751234', role: 'police', policeStationCode: 'LUC-002' },
      { name: 'Officer Varanasi', email: 'varanasi.uttarpradesh@police.gov.in', password: hashedPassword, phone: '+91-542-2651234', role: 'police', policeStationCode: 'VAR-001' },
      { name: 'Officer Agra', email: 'agra.uttarpradesh@police.gov.in', password: hashedPassword, phone: '+91-562-2651234', role: 'police', policeStationCode: 'AGR-001' },
      
      // Chandigarh/Punjab/Haryana Police Officers
      { name: 'Officer Sector 17', email: 'sector17.chandigarh@police.gov.in', password: hashedPassword, phone: '+91-172-2651234', role: 'police', policeStationCode: 'CHD-001' },
      { name: 'Officer Mohali', email: 'mohali.punjab@police.gov.in', password: hashedPassword, phone: '+91-172-2751234', role: 'police', policeStationCode: 'MOH-001' },
      { name: 'Officer Ludhiana', email: 'ludhiana.punjab@police.gov.in', password: hashedPassword, phone: '+91-161-2651234', role: 'police', policeStationCode: 'LUD-001' },
      { name: 'Officer Gurgaon', email: 'gurgaon.haryana@police.gov.in', password: hashedPassword, phone: '+91-124-2651234', role: 'police', policeStationCode: 'GUR-001' },
      
      // Other States Police Officers  
      { name: 'Officer Bhubaneswar', email: 'bhubaneswar.odisha@police.gov.in', password: hashedPassword, phone: '+91-674-2651234', role: 'police', policeStationCode: 'BBR-001' },
      { name: 'Officer Cuttack', email: 'cuttack.odisha@police.gov.in', password: hashedPassword, phone: '+91-671-2651234', role: 'police', policeStationCode: 'CUT-001' },
      { name: 'Officer Ernakulam', email: 'ernakulam.kochi@police.gov.in', password: hashedPassword, phone: '+91-484-2651234', role: 'police', policeStationCode: 'KOC-001' },
      { name: 'Officer Fort Kochi', email: 'fortkochi.kerala@police.gov.in', password: hashedPassword, phone: '+91-484-2751234', role: 'police', policeStationCode: 'KOC-002' },
      { name: 'Officer Trivandrum', email: 'trivandrum.kerala@police.gov.in', password: hashedPassword, phone: '+91-471-2651234', role: 'police', policeStationCode: 'TVM-001' },
      { name: 'Officer Pan Bazaar', email: 'panbazaar.guwahati@police.gov.in', password: hashedPassword, phone: '+91-361-2651234', role: 'police', policeStationCode: 'GUW-001' },
      { name: 'Officer Dispur', email: 'dispur.assam@police.gov.in', password: hashedPassword, phone: '+91-361-2751234', role: 'police', policeStationCode: 'GUW-002' },
      { name: 'Officer Imphal', email: 'imphal.manipur@police.gov.in', password: hashedPassword, phone: '+91-385-2651234', role: 'police', policeStationCode: 'IMP-001' },
      { name: 'Officer Vijay Nagar', email: 'vijaynagar.indore@police.gov.in', password: hashedPassword, phone: '+91-731-2651234', role: 'police', policeStationCode: 'IND-001' },
      { name: 'Officer MP Nagar', email: 'mpnagar.bhopal@police.gov.in', password: hashedPassword, phone: '+91-755-2651234', role: 'police', policeStationCode: 'BHO-001' },
      { name: 'Officer Boring Road', email: 'boringroad.patna@police.gov.in', password: hashedPassword, phone: '+91-612-2651234', role: 'police', policeStationCode: 'PAT-001' },
      { name: 'Officer Gandhi Maidan', email: 'gandhimaidan.bihar@police.gov.in', password: hashedPassword, phone: '+91-612-2751234', role: 'police', policeStationCode: 'PAT-002' },
      { name: 'Officer Clock Tower', email: 'clocktower.dehradun@police.gov.in', password: hashedPassword, phone: '+91-135-2651234', role: 'police', policeStationCode: 'DEH-001' },
      { name: 'Officer Haridwar', email: 'haridwar.uttarakhand@police.gov.in', password: hashedPassword, phone: '+91-1334-651234', role: 'police', policeStationCode: 'HAR-001' },
      { name: 'Officer Raipur', email: 'civillines.raipur@police.gov.in', password: hashedPassword, phone: '+91-771-2651234', role: 'police', policeStationCode: 'RAI-001' },
      { name: 'Officer Ranchi', email: 'mainroad.ranchi@police.gov.in', password: hashedPassword, phone: '+91-651-2651234', role: 'police', policeStationCode: 'RAN-001' },
      { name: 'Officer Shimla', email: 'themall.shimla@police.gov.in', password: hashedPassword, phone: '+91-177-2651234', role: 'police', policeStationCode: 'SHI-001' },
      { name: 'Officer Jammu', email: 'gandhinagar.jammu@police.gov.in', password: hashedPassword, phone: '+91-191-2651234', role: 'police', policeStationCode: 'JAM-001' },
      { name: 'Officer Srinagar', email: 'dalgate.srinagar@police.gov.in', password: hashedPassword, phone: '+91-194-2651234', role: 'police', policeStationCode: 'SRI-001' },
      { name: 'Officer Panaji', email: 'panaji.goa@police.gov.in', password: hashedPassword, phone: '+91-832-2651234', role: 'police', policeStationCode: 'GOA-001' },
      { name: 'Officer Margao', email: 'margao.goa@police.gov.in', password: hashedPassword, phone: '+91-832-2751234', role: 'police', policeStationCode: 'GOA-002' },
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
