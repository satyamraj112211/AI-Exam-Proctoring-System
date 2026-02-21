const bcrypt = require('bcrypt');

// In-memory user store for demo purposes.
// In production you would fetch users from a database instead.
//
// Passwords below are bcrypt hashes for the plain passwords:
// - admin@example.com   / Admin@123
// - teacher@example.com / Teacher@123
// - student@example.com / Student@123

// Helper to hash synchronously at startup (small set of users only).
const hash = (plain) => bcrypt.hashSync(plain, 10);

const users = [
  {
    id: 1,
    email: 'admin@example.com',
    passwordHash: hash('Admin@123'),
    role: 'admin',
  },
  {
    id: 2,
    email: 'teacher@example.com',
    passwordHash: hash('Teacher@123'),
    role: 'teacher',
  },
  {
    id: 3,
    email: 'student@example.com',
    passwordHash: hash('Student@123'),
    role: 'student',
  },
];

/**
 * Find a user by email (case-insensitive).
 */
function findByEmail(email) {
  if (!email) return null;
  const normalized = String(email).trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

module.exports = {
  users,
  findByEmail,
};



















