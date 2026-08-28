/**
 * SYNTHETIC DEMO SEED DATA — DECENTRAVOTE GOVERNANCE SYSTEM
 * 
 * DISCLAIMER:
 * All user names, NIC numbers, addresses, and phone numbers in this file 
 * are 100% SYNTHETIC & GENERATED DEMO DATA for academic assessment testing.
 * NO real citizens' identity data is stored or used.
 */

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

const FIRST_NAMES = [
  'Kamal', 'Nimal', 'Sunil', 'Kasun', 'Ruwan', 'Dilshan', 'Pathum', 'Nuwan',
  'Saman', 'Anura', 'Mahesh', 'Chathura', 'Kavinda', 'Dinesh', 'Thilina',
  'Anushka', 'Chamari', 'Kumari', 'Dilhani', 'Nirosha', 'Sanduni', 'Hiruni',
  'Tharushi', 'Kavindi', 'Shenali', 'Ama', 'Pashupati', 'Rashmi', 'Kishan'
];

const LAST_NAMES = [
  'Perera', 'Fernando', 'Silva', 'De Silva', 'Jayawardena', 'Gunawardena',
  'Bandara', 'Rathnayake', 'Wickramasinghe', 'Herath', 'Dissanayake',
  'Gamage', 'Fonseka', 'Rajapaksha', 'Senanayake', 'Peiris', 'Mendis'
];

export function generateSyntheticUsers(count = 105) {
  const users = [];

  // Default Admin User
  users.push({
    id: 'usr_admin_001',
    fullName: 'System Administrator',
    email: 'admin@decentravote.lk',
    passwordHash: 'c7d740c0363297a78e7c10b77b7d0d0f:2661d43a6d7162b71946059d0fb7153a51f893e433db97ffc6d2c499c750e6878b668f44ff5310619a9d775a2cb7034b07cf0f47c9e992160d5b7ed5106297ee', // 'AdminPass123!'
    role: 'ADMIN',
    verificationStatus: 'APPROVED',
    nicNumber: '198500000000',
    dob: '1985-01-15',
    gender: 'Male',
    nationality: 'Sri Lankan',
    address: '100 Senate Square, Colombo 07',
    district: 'Colombo',
    province: 'Western',
    city: 'Colombo',
    phone: '+94 11 200 0000',
    linkedWalletAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Hardhat Account #0
    walletVerifiedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Pre-configured Test Voters (Hardhat Accounts #1, #2, #3)
  const hardhatVoters = [
    {
      id: 'usr_voter_001',
      fullName: 'Alice Perera (Hardhat Voter 1)',
      email: 'voter1@decentravote.lk',
      verificationStatus: 'APPROVED',
      nicNumber: '199212345678',
      district: 'Colombo',
      linkedWalletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    },
    {
      id: 'usr_voter_002',
      fullName: 'Bob Fernando (Hardhat Voter 2)',
      email: 'voter2@decentravote.lk',
      verificationStatus: 'APPROVED',
      nicNumber: '199456789012',
      district: 'Kandy',
      linkedWalletAddress: '0x3C44CdD16057e15039680e753620319336710017',
    },
    {
      id: 'usr_voter_003',
      fullName: 'Charlie Silva (Hardhat Voter 3)',
      email: 'voter3@decentravote.lk',
      verificationStatus: 'PENDING_VERIFICATION',
      nicNumber: '199890123456',
      district: 'Galle',
      linkedWalletAddress: '0x90F79bf6EB2c4f8090654381D227588db93b2671',
    },
  ];

  hardhatVoters.forEach(hv => {
    users.push({
      ...hv,
      passwordHash: 'c7d740c0363297a78e7c10b77b7d0d0f:2661d43a6d7162b71946059d0fb7153a51f893e433db97ffc6d2c499c750e6878b668f44ff5310619a9d775a2cb7034b07cf0f47c9e992160d5b7ed5106297ee',
      role: 'VOTER',
      dob: '1995-05-10',
      gender: 'Male',
      nationality: 'Sri Lankan',
      address: 'Synthetic Address Line',
      province: 'Western',
      city: hv.district,
      phone: '+94 77 000 0000',
      walletVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // Generate remaining synthetic voters up to count
  const statuses = ['APPROVED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'REJECTED'];
  
  for (let i = 5; i <= count; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    const status = statuses[i % statuses.length];
    const district = DISTRICTS[i % DISTRICTS.length];
    const nicYear = 1970 + (i % 30);
    const nicNum = `${nicYear}${String(10000000 + i).substring(1)}`;

    users.push({
      id: `usr_syn_${String(i).padStart(3, '0')}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.lk`,
      passwordHash: 'c7d740c0363297a78e7c10b77b7d0d0f:2661d43a6d7162b71946059d0fb7153a51f893e433db97ffc6d2c499c750e6878b668f44ff5310619a9d775a2cb7034b07cf0f47c9e992160d5b7ed5106297ee',
      role: 'VOTER',
      verificationStatus: status,
      nicNumber: nicNum,
      dob: `${nicYear}-06-20`,
      gender: i % 2 === 0 ? 'Male' : 'Female',
      nationality: 'Sri Lankan',
      address: `No. ${i}, Main Street, ${district}`,
      district: district,
      province: 'Sri Lanka',
      city: district,
      phone: `+94 77 ${1000000 + i}`,
      linkedWalletAddress: status === 'APPROVED' ? `0x${String(i).padStart(40, 'a')}` : null,
      walletVerifiedAt: status === 'APPROVED' ? new Date().toISOString() : null,
      rejectionReason: status === 'REJECTED' ? 'Image resolution insufficient for NIC details' : null,
      createdAt: new Date(Date.now() - (i * 3600 * 1000)).toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  return users;
}
