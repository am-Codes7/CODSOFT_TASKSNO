const { connectDB } = require('./config/database');
const { syncDatabase, Contact } = require('./models');

const sampleContacts = [
  {
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.org',
    phoneNumber: '+1 415-555-0142',
    address: '8400 Sunset Blvd, Los Angeles, CA',
    company: 'Resistance Ops',
    category: 'Personal',
    notes: 'Emergency contact. Highly reliable.'
  },
  {
    name: 'Bruce Wayne',
    email: 'bruce@wayneenterprises.com',
    phoneNumber: '+1 212-555-0199',
    address: '1007 Mountain Drive, Gotham City',
    company: 'Wayne Enterprises',
    category: 'Professional',
    notes: 'Chief Executive Officer. High-priority stakeholder.'
  },
  {
    name: 'Elena Rostova',
    email: 'elena.rostova@quantumcloud.io',
    phoneNumber: '+44 20 7946 0912',
    address: '42 Silicon Roundabout, London, UK',
    company: 'QuantumCloud AI',
    category: 'Professional',
    notes: 'Lead Architect for Distributed Systems.'
  },
  {
    name: 'Marcus Vance',
    email: 'marcus.vance@solardyne.tech',
    phoneNumber: '+1 312-555-0177',
    address: '233 S Wacker Dr, Chicago, IL',
    company: 'Solardyne Renewable',
    category: 'Professional',
    notes: 'VP of Engineering.'
  },
  {
    name: 'Jessica Pearson',
    email: 'j.pearson@pearsonhardman.legal',
    phoneNumber: '+1 212-555-0184',
    address: '601 Lexington Ave, New York, NY',
    company: 'Pearson Hardman LLP',
    category: 'Professional',
    notes: 'Managing Partner - Legal Counsel.'
  },
  {
    name: 'David Miller',
    email: 'david.miller@gmail.com',
    phoneNumber: '+1 617-555-0128',
    address: '124 Beacon Street, Boston, MA',
    company: 'Freelance Design',
    category: 'Personal',
    notes: 'College friend and UI/UX consultant.'
  },
  {
    name: 'Dr. Evelyn Reed',
    email: 'evelyn.reed@biocare-research.org',
    phoneNumber: '+1 206-555-0155',
    address: '500 Fairview Ave N, Seattle, WA',
    company: 'BioCare Genomics',
    category: 'Other',
    notes: 'Research partner in computational biology.'
  }
];

const seed = async () => {
  try {
    console.log('Seeding database with sample contacts...');
    await connectDB();
    await syncDatabase(true); // reset and recreate table

    for (const contact of sampleContacts) {
      await Contact.create(contact);
    }

    console.log(`Successfully seeded ${sampleContacts.length} contacts!`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed database:', error.message);
    process.exit(1);
  }
};

seed();
