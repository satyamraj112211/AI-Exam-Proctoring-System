# Contributing to Exam Proctoring System

Thank you for your interest in contributing to the Exam Proctoring System! This document provides guidelines and instructions for contributing to this project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)

## 🤝 Code of Conduct

### Our Pledge
We are committed to providing a welcoming and inspiring community for all. Please be respectful and constructive in all interactions.

### Expected Behavior
- Use welcoming and inclusive language
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community

## 🚀 Getting Started

### 1. Fork the Repository
```bash
# Click the "Fork" button on GitHub
```

### 2. Clone Your Fork
```bash
git clone https://github.com/YOUR-USERNAME/exam-proctoring-system.git
cd exam-proctoring-system
```

### 3. Add Upstream Remote
```bash
git remote add upstream https://github.com/kunal8s/exam-proctoring-system.git
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# Session Auth
cd ../session-auth
npm install
```

### 5. Set Up Environment
```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure your local settings
```

## 🔄 Development Workflow

### 1. Stay Synchronized
```bash
# Fetch latest changes from upstream
git fetch upstream

# Merge upstream changes to your main
git checkout main
git merge upstream/main
```

### 2. Create a Feature Branch
```bash
# Use descriptive branch names
git checkout -b feature/add-user-dashboard
git checkout -b bugfix/fix-login-error
git checkout -b docs/update-api-docs
```

### Branch Naming Convention
- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

### 3. Make Your Changes
```bash
# Make changes to code
# Test your changes locally
# Ensure code follows style guidelines
```

## 📝 Coding Standards

### JavaScript/React Style Guide

#### General Rules
- Use ES6+ features (const/let, arrow functions, destructuring)
- Use meaningful variable and function names
- Keep functions small and focused (single responsibility)
- Comment complex logic
- Remove console.logs before committing

#### File Structure
```javascript
// 1. Imports (external, then internal)
import React from 'react';
import axios from 'axios';

import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

// 2. Constants
const API_URL = '/api/v1';

// 3. Component/Function
const MyComponent = () => {
  // State
  const [data, setData] = useState([]);
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

// 4. Exports
export default MyComponent;
```

#### React Best Practices
- Use functional components with hooks
- Implement proper prop validation
- Extract reusable components
- Use custom hooks for shared logic
- Implement proper error boundaries
- Optimize with React.memo when needed

#### Backend Best Practices
- Use async/await instead of callbacks
- Implement proper error handling
- Validate all inputs
- Use middleware for common operations
- Follow RESTful API conventions
- Document API endpoints

### CSS/Tailwind Guidelines
- Use Tailwind utility classes first
- Create custom CSS only when necessary
- Follow mobile-first approach
- Use CSS variables for theme colors
- Keep specificity low

### File Naming
- Components: `PascalCase.jsx` (e.g., `UserDashboard.jsx`)
- Utilities: `camelCase.js` (e.g., `formatDate.js`)
- Hooks: `useHookName.js` (e.g., `useAuth.js`)
- Constants: `UPPER_SNAKE_CASE.js` (e.g., `API_CONSTANTS.js`)

## 💬 Commit Guidelines

### Commit Message Format
```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types
- **Add** - New feature or functionality
- **Fix** - Bug fix
- **Update** - Modify existing feature
- **Remove** - Delete code/file
- **Refactor** - Code restructuring without behavior change
- **Docs** - Documentation changes
- **Style** - Code formatting (no logic change)
- **Test** - Add or update tests
- **Chore** - Maintenance tasks

### Examples
```bash
# Good commits
git commit -m "Add: User authentication with JWT"
git commit -m "Fix: Login page redirect issue on mobile"
git commit -m "Update: Exam dashboard with new analytics"
git commit -m "Docs: Add API documentation for auth endpoints"

# Bad commits (avoid these)
git commit -m "fixed stuff"
git commit -m "updates"
git commit -m "asdfasdf"
```

### Writing Good Commit Messages
- Use imperative mood ("Add feature" not "Added feature")
- Capitalize first letter
- No period at the end
- Limit subject line to 50 characters
- Provide detailed body for complex changes

## 🔍 Pull Request Process

### Before Submitting

1. **Test Your Changes**
   ```bash
   # Run linting
   npm run lint
   
   # Run tests
   npm test
   
   # Test manually in browser
   ```

2. **Update Documentation**
   - Update README if needed
   - Add JSDoc comments
   - Update API documentation

3. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "Add: Your feature description"
   ```

4. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

### Creating the Pull Request

1. Go to your fork on GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2

## Testing Done
- Test 1
- Test 2

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally
```

### Review Process

1. **Automated Checks** - Wait for CI/CD to pass
2. **Code Review** - Address reviewer feedback
3. **Approval** - Get approval from maintainers
4. **Merge** - Maintainers will merge your PR

### After Merge

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

## 🧪 Testing Guidelines

### Frontend Testing
- Test components in isolation
- Test user interactions
- Test edge cases
- Test responsive design

### Backend Testing
- Test API endpoints
- Test error handling
- Test authentication/authorization
- Test database operations

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Works on different browsers
- [ ] Works on mobile devices
- [ ] Handles errors gracefully
- [ ] Loading states work properly
- [ ] Form validations work

## 🐛 Reporting Bugs

### Before Submitting
- Check existing issues
- Test on latest version
- Gather necessary information

### Bug Report Template
```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Screenshots
[If applicable]

## Environment
- OS: [e.g., Windows 10]
- Browser: [e.g., Chrome 120]
- Node Version: [e.g., 18.17.0]

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Problem It Solves
What problem does this solve?

## Proposed Solution
How should it work?

## Alternatives Considered
Other solutions you've thought about

## Additional Context
Any other relevant information
```

## 📚 Resources

- [Git Documentation](https://git-scm.com/doc)
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Express Documentation](https://expressjs.com)

## ❓ Questions?

If you have questions, feel free to:
- Open an issue with the "question" label
- Reach out to maintainers
- Check existing documentation

## 🙏 Thank You!

Thank you for contributing to make this project better! Every contribution, no matter how small, is valuable and appreciated.

---

**Happy Coding! 🚀**
