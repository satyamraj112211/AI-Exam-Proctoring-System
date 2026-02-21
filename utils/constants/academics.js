const UNIVERSITY_NAMES = [
  'Indian Institute of Science (IISc), Bangalore',
  'Jawaharlal Nehru University (JNU), Delhi',
  'Banaras Hindu University (BHU), Varanasi',
  'University of Delhi (DU)',
  'Jadavpur University, Kolkata',
  'Jamia Millia Islamia (JMI), Delhi',
  'Hyderabad University (UoH)',
  'Savitribai Phule Pune University',
  'Aligarh Muslim University (AMU)',
  'Manipal Academy of Higher Education',
  'Birla Institute of Technology & Science (BITS Pilani)',
  'Vellore Institute of Technology (VIT), Vellore',
  'Anna University, Chennai',
  'Calcutta University',
  'Mumbai University',
  'Osmania University, Hyderabad',
  'Amrita Vishwa Vidyapeetham',
  'Lovely Professional University (LPU)',
  'SRM Institute of Science & Technology',
];

const COLLEGE_NAMES = [
  'St. Stephen’s College, Delhi',
  'Hindu College, Delhi',
  'Miranda House, Delhi',
  'Hansraj College, Delhi',
  'Sri Venkateswara College, Delhi',
  'Loyola College, Chennai',
  'Presidency College, Chennai',
  'St. Xavier’s College, Mumbai',
  'St. Xavier’s College, Kolkata',
  'Christ College (Autonomous), Irinjalakuda',
  'Lady Shri Ram College (LSR), Delhi',
  'Ramjas College, Delhi',
  'Kirori Mal College, Delhi',
  'Joseph’s College, Bangalore',
  'Fergusson College, Pune',
  'MCC – Madras Christian College',
  'Symbiosis College of Arts & Commerce, Pune',
  'H.R. College of Commerce & Economics, Mumbai',
  'Elphinstone College, Mumbai',
  'Mount Carmel College, Bengaluru',
];

// Branch catalog with category marking
const BRANCHES = [
  // Sciences
  { code: 'PHY', name: 'Physics', category: 'non-tech' },
  { code: 'CHEM', name: 'Chemistry', category: 'non-tech' },
  { code: 'MATH', name: 'Mathematics', category: 'non-tech' },
  { code: 'BIO', name: 'Biology / Life Sciences', category: 'non-tech' },
  { code: 'BT', name: 'Biotechnology', category: 'non-tech' },
  { code: 'BCHEM', name: 'Biochemistry', category: 'non-tech' },
  { code: 'MB', name: 'Microbiology', category: 'non-tech' },
  { code: 'ENV', name: 'Environmental Science', category: 'non-tech' },
  { code: 'STAT', name: 'Statistics', category: 'non-tech' },
  { code: 'GEO', name: 'Geology', category: 'non-tech' },
  { code: 'ASTRO', name: 'Astronomy / Astrophysics', category: 'non-tech' },
  // Engineering / Tech
  { code: 'CSE', name: 'Computer Science & Engineering', category: 'tech' },
  { code: 'IT', name: 'Information Technology', category: 'tech' },
  { code: 'ECE', name: 'Electronics & Communication Engineering', category: 'tech' },
  { code: 'EEE', name: 'Electrical Engineering', category: 'tech' },
  { code: 'ME', name: 'Mechanical Engineering', category: 'tech' },
  { code: 'CE', name: 'Civil Engineering', category: 'tech' },
  { code: 'AE', name: 'Aerospace Engineering', category: 'tech' },
  { code: 'CHE', name: 'Chemical Engineering', category: 'tech' },
  { code: 'BTE', name: 'Biotechnology Engineering', category: 'tech' },
  { code: 'MTE', name: 'Metallurgical Engineering', category: 'tech' },
  { code: 'RAI', name: 'Robotics / AI / Data Science', category: 'tech' },
  // Arts / Humanities
  { code: 'ENG', name: 'English', category: 'non-tech' },
  { code: 'HIS', name: 'History', category: 'non-tech' },
  { code: 'PSCI', name: 'Political Science', category: 'non-tech' },
  { code: 'SOC', name: 'Sociology', category: 'non-tech' },
  { code: 'PSY', name: 'Psychology', category: 'non-tech' },
  { code: 'PHIL', name: 'Philosophy', category: 'non-tech' },
  { code: 'GEOG', name: 'Geography', category: 'non-tech' },
  { code: 'LING', name: 'Linguistics', category: 'non-tech' },
  { code: 'FA', name: 'Fine Arts', category: 'non-tech' },
  { code: 'ANTH', name: 'Anthropology', category: 'non-tech' },
  { code: 'PA', name: 'Performing Arts', category: 'non-tech' },
  // Commerce / Management
  { code: 'BCOM', name: 'B.Com', category: 'non-tech' },
  { code: 'BBA', name: 'BBA / MBA', category: 'non-tech' },
  { code: 'ECO', name: 'Economics', category: 'non-tech' },
  { code: 'FIN', name: 'Finance', category: 'non-tech' },
  { code: 'MKT', name: 'Marketing', category: 'non-tech' },
  { code: 'IB', name: 'International Business', category: 'non-tech' },
  { code: 'HR', name: 'Human Resource Management', category: 'non-tech' },
  { code: 'OPS', name: 'Operations & Supply Chain', category: 'non-tech' },
  { code: 'ENT', name: 'Entrepreneurship', category: 'non-tech' },
  // Tech specializations
  { code: 'BCA', name: 'BCA / MCA', category: 'tech' },
  { code: 'DS', name: 'Data Science', category: 'tech' },
  { code: 'AI', name: 'Artificial Intelligence', category: 'tech' },
  { code: 'CYBER', name: 'Cybersecurity', category: 'tech' },
  { code: 'CLOUD', name: 'Cloud Computing', category: 'tech' },
  { code: 'SWE', name: 'Software Engineering', category: 'tech' },
  // Law
  { code: 'LAW', name: 'Law (LLB / LLM)', category: 'non-tech' },
  // Education
  { code: 'BED', name: 'B.Ed', category: 'non-tech' },
  { code: 'MED', name: 'M.Ed / Educational Research', category: 'non-tech' },
  // Social sciences
  { code: 'IR', name: 'International Relations', category: 'non-tech' },
  { code: 'PP', name: 'Public Policy', category: 'non-tech' },
  { code: 'SW', name: 'Social Work', category: 'non-tech' },
  // Media / Communication
  { code: 'JMC', name: 'Journalism & Mass Communication', category: 'non-tech' },
  { code: 'DM', name: 'Digital Media / Media Studies', category: 'non-tech' },
  { code: 'FTV', name: 'Film & Television', category: 'non-tech' },
  { code: 'CORP', name: 'Corporate Communication', category: 'non-tech' },
];

const DEFAULT_YEARS = [
  { label: '1', sections: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
  { label: '2', sections: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
  { label: '3', sections: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
  { label: '4', sections: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] },
];

module.exports = {
  UNIVERSITY_NAMES,
  COLLEGE_NAMES,
  BRANCHES,
  DEFAULT_YEARS,
};





















