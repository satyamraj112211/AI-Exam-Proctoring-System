const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateUniversityId = (universityId) => {
  return universityId.length >= 3;
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUniversityId,
};