const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function hashPassword(password) {
  const salt = 'c7d740c0363297a78e7c10b77b7d0d0f';
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

const sriLankanFirstNames = [
  'Kamal', 'Nimal', 'Sunil', 'Kasun', 'Ruwan', 'Dilshan', 'Pathum', 'Nuwan', 'Saman', 'Anura',
  'Mahesh', 'Chathura', 'Kavinda', 'Dinesh', 'Thilina', 'Anushka', 'Chamari', 'Kumari', 'Dilhani', 'Nirosha',
  'Sanduni', 'Hiruni', 'Tharushi', 'Kavindi', 'Shenali', 'Ama', 'Pashupati', 'Rashmi', 'Kishan', 'Charith',
  'Lasith', 'Dhananjaya', 'Kusal', 'Wanindu', 'Bhanuka', 'Avishka', 'Ashen', 'Praveen', 'Sanjaya', 'Roshan',
  'Isuru', 'Melani', 'Nipuni', 'Subhashini', 'Imesha', 'Devika', 'Gayani', 'Nilukshi', 'Oshadie', 'Hansani'
];

const sriLankanLastNames = [
  'Perera', 'Fernando', 'Silva', 'De Silva', 'Jayawardena', 'Gunawardena', 'Bandara', 'Rathnayake',
  'Wickramasinghe', 'Herath', 'Dissanayake', 'Gamage', 'Fonseka', 'Rajapaksha', 'Senanayake', 'Peiris',
  'Mendis', 'Abeyrathne', 'Kumara', 'Liyanage', 'Weerasinghe', 'Ranasinghe', 'Karunaratne', 'Premaratne'
];

const districts = [
  { district: 'Colombo', province: 'Western', city: 'Colombo 07' },
  { district: 'Gampaha', province: 'Western', city: 'Negombo' },
  { district: 'Kalutara', province: 'Western', city: 'Panadura' },
  { district: 'Kandy', province: 'Central', city: 'Kandy City' },
  { district: 'Matale', province: 'Central', city: 'Matale Town' },
  { district: 'Nuwara Eliya', province: 'Central', city: 'Nuwara Eliya' },
  { district: 'Galle', province: 'Southern', city: 'Galle Fort' },
  { district: 'Matara', province: 'Southern', city: 'Matara Town' },
  { district: 'Hambantota', province: 'Southern', city: 'Tangalle' },
  { district: 'Jaffna', province: 'Northern', city: 'Jaffna Town' },
  { district: 'Kilinochchi', province: 'Northern', city: 'Kilinochchi' },
  { district: 'Mannar', province: 'Northern', city: 'Mannar Town' },
  { district: 'Vavuniya', province: 'Northern', city: 'Vavuniya' },
  { district: 'Mullaitivu', province: 'Northern', city: 'Mullaitivu' },
  { district: 'Batticaloa', province: 'Eastern', city: 'Batticaloa' },
  { district: 'Ampara', province: 'Eastern', city: 'Kalmunai' },
  { district: 'Trincomalee', province: 'Eastern', city: 'Trincomalee' },
  { district: 'Kurunegala', province: 'North Western', city: 'Kurunegala' },
  { district: 'Puttalam', province: 'North Western', city: 'Chilaw' },
  { district: 'Anuradhapura', province: 'North Central', city: 'Anuradhapura' },
  { district: 'Polonnaruwa', province: 'North Central', city: 'Polonnaruwa' },
  { district: 'Badulla', province: 'Uva', city: 'Badulla' },
  { district: 'Moneragala', province: 'Uva', city: 'Moneragala' },
  { district: 'Ratnapura', province: 'Sabaragamuwa', city: 'Ratnapura' },
  { district: 'Kegalle', province: 'Sabaragamuwa', city: 'Kegalle' }
];

function generateSeedData() {
  console.log("Generating 120+ clean realistic database records...");

  const users = [
    {
      id: "usr_admin_001",
      fullName: "System Administrator",
      email: "admin@decentravote.lk",
      passwordHash: hashPassword("AdminPass123!"),
      role: "ADMIN",
      verificationStatus: "APPROVED",
      nicNumber: "198500000000",
      dob: "1985-01-15",
      gender: "Male",
      nationality: "Sri Lankan",
      address: "100 Senate Square, Independence Avenue, Colombo 07",
      district: "Colombo",
      province: "Western",
      city: "Colombo",
      phone: "+94 11 200 0000",
      linkedWalletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      walletVerifiedAt: "2026-08-24T00:00:00.000Z",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z"
    },
    {
      id: "usr_voter_001",
      fullName: "Alice Perera (Verified Voter 1)",
      email: "voter1@decentravote.lk",
      passwordHash: hashPassword("Password123!"),
      role: "VOTER",
      verificationStatus: "APPROVED",
      nicNumber: "199212345678",
      dob: "1992-05-10",
      gender: "Female",
      nationality: "Sri Lankan",
      address: "No. 45, Flower Road, Colombo 03",
      district: "Colombo",
      province: "Western",
      city: "Colombo",
      phone: "+94 77 123 4567",
      linkedWalletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      walletVerifiedAt: "2026-08-24T00:00:00.000Z",
      createdAt: "2026-08-01T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z"
    },
    {
      id: "usr_voter_002",
      fullName: "Bob Fernando (Verified Voter 2)",
      email: "voter2@decentravote.lk",
      passwordHash: hashPassword("Password123!"),
      role: "VOTER",
      verificationStatus: "APPROVED",
      nicNumber: "199456789012",
      dob: "1994-08-14",
      gender: "Male",
      nationality: "Sri Lankan",
      address: "No. 12, Peradeniya Road, Kandy",
      district: "Kandy",
      province: "Central",
      city: "Kandy",
      phone: "+94 71 987 6543",
      linkedWalletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      walletVerifiedAt: "2026-08-24T00:00:00.000Z",
      createdAt: "2026-08-02T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z"
    },
    {
      id: "usr_voter_003",
      fullName: "Charlie Silva (Verified Voter 3)",
      email: "voter3@decentravote.lk",
      passwordHash: hashPassword("Password123!"),
      role: "VOTER",
      verificationStatus: "APPROVED",
      nicNumber: "199890123456",
      dob: "1998-11-22",
      gender: "Male",
      nationality: "Sri Lankan",
      address: "No. 88, Galle Road, Galle Fort",
      district: "Galle",
      province: "Southern",
      city: "Galle",
      phone: "+94 75 555 4444",
      linkedWalletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      walletVerifiedAt: "2026-08-24T00:00:00.000Z",
      createdAt: "2026-08-05T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z"
    },
    {
      id: "usr_voter_004",
      fullName: "Dilshan Jayawardena (Pending Verification)",
      email: "voter4@decentravote.lk",
      passwordHash: hashPassword("Password123!"),
      role: "VOTER",
      verificationStatus: "PENDING_VERIFICATION",
      nicNumber: "199678901234",
      dob: "1996-03-18",
      gender: "Male",
      nationality: "Sri Lankan",
      address: "No. 14, Station Road, Jaffna",
      district: "Jaffna",
      province: "Northern",
      city: "Jaffna",
      phone: "+94 77 999 8888",
      linkedWalletAddress: null,
      walletVerifiedAt: null,
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z"
    }
  ];

  // Generate 120 realistic voters
  const statuses = ['APPROVED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'REJECTED'];
  for (let i = 5; i <= 125; i++) {
    const fn = sriLankanFirstNames[i % sriLankanFirstNames.length];
    const ln = sriLankanLastNames[i % sriLankanLastNames.length];
    const loc = districts[i % districts.length];
    const status = statuses[i % statuses.length];
    const gender = (i % 2 === 0) ? 'Male' : 'Female';
    const nicNumber = `197${(i % 30).toString().padStart(2, '0')}0000${i.toString().padStart(3, '0')}`;

    users.push({
      id: `usr_syn_${i.toString().padStart(3, '0')}`,
      fullName: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/\s+/g, '')}${i}@example.lk`,
      passwordHash: hashPassword("Password123!"),
      role: "VOTER",
      verificationStatus: status,
      nicNumber: nicNumber,
      dob: `197${i % 10}-0${(i % 9) + 1}-15`,
      gender: gender,
      nationality: "Sri Lankan",
      address: `No. ${i}, Main Street, ${loc.city}`,
      district: loc.district,
      province: loc.province,
      city: loc.city,
      phone: `+94 77 100${i.toString().padStart(4, '0')}`,
      linkedWalletAddress: status === 'APPROVED' ? `0x${i.toString(16).padStart(40, 'a')}` : null,
      walletVerifiedAt: status === 'APPROVED' ? new Date(Date.now() - i * 3600000).toISOString() : null,
      rejectionReason: status === 'REJECTED' ? 'Image resolution insufficient for NIC details' : null,
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  const elections = [
    {
      id: 1,
      title: "Sri Lankan Presidential Governance Election 2026",
      description: "Institutional preferential election evaluating candidate platforms across Sri Lankan provincial districts with automated 2nd preference tie resolution.",
      startTime: 1787443200,
      endTime: 1788134400,
      candidateCount: 3,
      totalVotes: 142,
      winnerId: 0,
      status: 1,
      resultStatus: 0,
      maxPreferences: 2,
      secondPreferenceEnabled: true,
      tieBreakMode: 1,
      candidates: [
        { id: 1, name: "Hon. Anura Dissanayake (Alliance)", description: "Economic modernization, anti-corruption, and digital governance.", primaryVotes: 65, secondaryVotes: 20 },
        { id: 2, name: "Hon. Sajith Premadasa (Democrat)", description: "Social welfare, rural infrastructure, and export growth.", primaryVotes: 55, secondaryVotes: 25 },
        { id: 3, name: "Hon. Ranil Wickremesinghe (Reform)", description: "Financial stabilization, debt restructuring, and trade policy.", primaryVotes: 22, secondaryVotes: 10 }
      ]
    },
    {
      id: 2,
      title: "National Energy & Digital Infrastructure Referendum",
      description: "Public governance ballot on decentralizing provincial clean energy allocation and smart grid infrastructure investments.",
      startTime: 1787356800,
      endTime: 1787961600,
      candidateCount: 2,
      totalVotes: 98,
      winnerId: 0,
      status: 1,
      resultStatus: 0,
      maxPreferences: 2,
      secondPreferenceEnabled: true,
      tieBreakMode: 1,
      candidates: [
        { id: 1, name: "Proposal A: Solar Microgrid Network Expansion", description: "Allocate 40% of infrastructure budget to provincial solar grids.", primaryVotes: 52, secondaryVotes: 15 },
        { id: 2, name: "Proposal B: National Offshore Wind Platform", description: "Focus capital on offshore wind power generation.", primaryVotes: 46, secondaryVotes: 18 }
      ]
    },
    {
      id: 3,
      title: "Colombo Chamber of Commerce Executive Board Election",
      description: "Institutional preferential vote for executive board member selection with on-chain audit trail.",
      startTime: 1786838400,
      endTime: 1787356800,
      candidateCount: 4,
      totalVotes: 215,
      winnerId: 1,
      status: 3,
      resultStatus: 1,
      maxPreferences: 2,
      secondPreferenceEnabled: true,
      tieBreakMode: 1,
      candidates: [
        { id: 1, name: "Dr. Hans Wijayasuriya", description: "Digital Transformation & Regional Trade.", primaryVotes: 110, secondaryVotes: 30 },
        { id: 2, name: "Kasturi Chellaraja Wilson", description: "Supply Chain & Logistics Expansion.", primaryVotes: 75, secondaryVotes: 40 },
        { id: 3, name: "Vish Govindasamy", description: "Agri-Export Modernization.", primaryVotes: 30, secondaryVotes: 15 }
      ]
    },
    {
      id: 4,
      title: "Central Bank Financial Policy Governance Referendum",
      description: "Advisory referendum on implementing central bank digital currency (CBDC) standards for cross-border settlement.",
      startTime: 1786500000,
      endTime: 1787100000,
      candidateCount: 2,
      totalVotes: 310,
      winnerId: 1,
      status: 3,
      resultStatus: 1,
      maxPreferences: 1,
      secondPreferenceEnabled: false,
      tieBreakMode: 1,
      candidates: [
        { id: 1, name: "Option 1: Adopt Wholesale CBDC Interoperability Standard", description: "Integrate institutional ledger for trade settlements.", primaryVotes: 195, secondaryVotes: 0 },
        { id: 2, name: "Option 2: Retain Traditional RTGS Infrastructure", description: "Maintain existing domestic real-time gross settlement.", primaryVotes: 115, secondaryVotes: 0 }
      ]
    },
    {
      id: 5,
      title: "Provincial Rural Connectivity & Digital Education Fund",
      description: "Governance proposal on funding broadband infrastructure for 500 rural schools across Sabaragamuwa and Northern provinces.",
      startTime: 1787500000,
      endTime: 1788200000,
      candidateCount: 2,
      totalVotes: 74,
      winnerId: 0,
      status: 1,
      resultStatus: 0,
      maxPreferences: 2,
      secondPreferenceEnabled: true,
      tieBreakMode: 1,
      candidates: [
        { id: 1, name: "Approve 100% Grant Allocation for School Fiber Networks", description: "Direct provincial budget to rural education connectivity.", primaryVotes: 48, secondaryVotes: 12 },
        { id: 2, name: "Approve Public-Private Partnership Telecom Concession", description: "Leverage private sector telecom infrastructure investment.", primaryVotes: 26, secondaryVotes: 14 }
      ]
    }
  ];

  const dbData = {
    users,
    documents: [],
    verifications: [],
    sessions: [],
    elections
  };

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf-8');
  console.log(`✓ Database successfully populated with ${users.length} users and ${elections.length} governance elections!`);
}

generateSeedData();
