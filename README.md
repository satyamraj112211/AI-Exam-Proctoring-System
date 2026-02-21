# 🎓 Online Examination & AI-Based Proctoring System

## 📌 Project Overview

A comprehensive **full-stack MERN application** demonstrating advanced **Git version control practices** integrated with a production-ready **Online Examination and AI-based Proctoring System**. This project showcases real-world collaborative development workflows using Git Bash and GitHub while implementing a scalable examination platform with real-time monitoring capabilities.

### 🎯 Key Highlights

- **Full-Stack MERN Architecture** - MongoDB, Express.js, React (with Vite), Node.js
- **Real-Time Proctoring** - AI-based monitoring with Socket.IO integration
- **Performance Monitoring** - Grafana dashboards for system observability
- **Session Management** - Secure authentication with JWT and Express sessions
- **DevOps Integration** - Docker containerization and deployment configurations
- **Advanced Git Workflows** - Branching, merging, and conflict resolution demonstrations

---

## 📁 Project Structure

```
exam-proctoring-system/
│
├── backend/                          # Node.js/Express Backend
│   ├── src/
│   │   ├── controllers/             # Route controllers
│   │   ├── routes/                  # API routes
│   │   ├── models/                  # MongoDB schemas
│   │   ├── middlewares/             # Custom middleware
│   │   ├── services/                # Business logic
│   │   └── utils/                   # Helper functions
│   │
│   ├── monitoring/
│   │   ├── prometheus.yml           # Metrics configuration
│   │   └── grafana/                 # Dashboard configs
│   │
│   ├── scripts/
│   │   └── syntheticLoad.js         # Load testing
│   │
│   ├── logs/                        # Application logs
│   ├── app.js                       # Express app setup
│   ├── server.js                    # Server entry point
│   ├── Dockerfile                   # Container config
│   ├── docker-compose.yml           # Multi-container setup
│   ├── package.json                 # Dependencies
│   ├── eslint.config.js             # Linting rules
│   ├── jest.config.js               # Test configuration
│   └── README.md                    # Backend docs
│
├── frontend/                        # React/Vite Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # React components
│   │   ├── pages/                   # Page components
│   │   ├── hooks/                   # Custom hooks
│   │   ├── services/                # API services
│   │   ├── context/                 # Context providers
│   │   ├── styles/                  # CSS files
│   │   └── App.jsx                  # Root component
│   │
│   ├── index.html                   # HTML entry point
│   ├── vite.config.js               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS setup
│   ├── postcss.config.js            # PostCSS config
│   ├── package.json                 # Dependencies
│   ├── eslint.config.js             # Linting rules
│   ├── render.yaml                  # Deployment config
│   └── README.md                    # Frontend docs
│
├── session-auth/                    # Authentication Service
│   ├── src/
│   │   ├── controllers/             # Auth controllers
│   │   ├── routes/                  # Auth routes
│   │   ├── models/                  # User models
│   │   └── middlewares/             # Auth middleware
│   │
│   ├── server.js                    # Auth server
│   └── package.json                 # Dependencies
│
├── .gitignore                       # Git ignore rules
├── structure.txt                    # Directory structure
├── folders.txt                      # Folder listing
└── README.md                        # Project documentation
```

---

## 🛠️ Technology Stack

### **Core Technologies**
- **Runtime** - Node.js (v18+)
- **Framework** - Express.js
- **Frontend** - React 19 with Vite
- **Database** - MongoDB
- **Real-Time** - Socket.IO

### **Development & DevOps**
- **Version Control** - Git, GitHub, Git Bash
- **Containerization** - Docker, Docker Compose
- **Monitoring** - Grafana, Prometheus, prom-client
- **Process Management** - Nodemon

### **Frontend Libraries**
- **UI Framework** - React with Tailwind CSS
- **State Management** - React Query (@tanstack/react-query)
- **Animations** - Framer Motion
- **HTTP Client** - Axios
- **Routing** - React Router DOM v7
- **Charts** - Recharts
- **Icons** - React Icons
- **Excel Export** - XLSX

### **Backend Libraries**
- **Authentication** - JWT, bcryptjs, express-session
- **Validation** - Joi, express-validator
- **Security** - Helmet, express-rate-limit
- **Email** - Nodemailer
- **File Upload** - Multer
- **Logging** - Winston, Morgan
- **Database ODM** - Mongoose
- **Session Store** - connect-mongo

### **Platform**
- **Operating System** - Windows 10/11
- **Shell** - Git Bash

---

## 🎯 Project Objectives

### Version Control Learning Outcomes
- ✅ Master Git Bash commands and workflows
- ✅ Implement branching strategies (feature, bugfix, experiment)
- ✅ Practice merge operations and conflict resolution
- ✅ Manage remote repositories with GitHub
- ✅ Document development processes comprehensively

### Application Development Goals
- ✅ Build scalable MERN stack architecture
- ✅ Implement secure authentication & authorization
- ✅ Create real-time proctoring features
- ✅ Integrate performance monitoring with Grafana
- ✅ Deploy production-ready application
- ✅ Follow industry best practices and coding standards

---

## 🚀 Features

### 🔐 **Authentication & Authorization**
- JWT-based authentication
- Session management with MongoDB store
- Role-based access control (Admin, Instructor, Student)
- Secure password hashing with bcryptjs

### 📝 **Examination Management**
- Create and manage exams
- Question bank system
- Automatic grading
- Results and analytics
- Excel export functionality

### 👁️ **AI-Based Proctoring**
- Real-time video monitoring
- Tab switching detection
- Full-screen enforcement
- Suspicious activity logging
- Live exam session tracking

### 📊 **Monitoring & Analytics**
- Grafana dashboards for system metrics
- Prometheus metrics collection
- API performance tracking
- Real-time system health monitoring
- Synthetic load testing scripts

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Smooth animations with Framer Motion
- Interactive charts with Recharts
- Professional icon library
- Mobile-friendly interface

---

## ⚙️ Git Commands Reference

### Repository Initialization
```bash
git init                          # Initialize repository
git status                        # Check repository status
git add .                         # Stage all changes
git commit -m "message"           # Commit changes
```

### Branching Operations
```bash
git branch <branch-name>          # Create new branch
git checkout <branch-name>        # Switch to branch
git checkout -b <branch-name>     # Create and switch
git branch -a                     # List all branches
git branch -d <branch-name>       # Delete branch
```

### Merging & Conflict Resolution
```bash
git merge <branch-name>           # Merge branch
git merge --abort                 # Abort merge
git diff                          # Check differences
```

### Remote Operations
```bash
git remote add origin <url>       # Add remote
git push -u origin <branch>       # Push to remote
git pull origin <branch>          # Pull from remote
git clone <url>                   # Clone repository
```

### History & Logs
```bash
git log                           # View commit history
git log --oneline --graph         # Visual graph
git log --all --decorate          # Detailed history
```

---

## 🌿 Branching Strategy

The project follows a **feature-branch workflow** with the following branches:

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Production-ready code | Active |
| `feature` | New feature development | Merged |
| `test` | Testing and QA | Merged |
| `bugfix` | Bug fixes | Merged |
| `experiment` | Experimental features | Merged |

### Workflow Pattern
1. Create feature branch from `main`
2. Develop and commit changes
3. Merge back to `main`
4. Resolve any conflicts
5. Push to GitHub

---

## 📦 Installation & Setup

### Prerequisites
```bash
# Required Software
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Git Bash
- Docker (optional, for containerization)
```

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Session Auth Setup
```bash
# Navigate to session-auth directory
cd session-auth

# Install dependencies
npm install

# Start authentication server
npm start
```

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/exam-proctoring
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
```

---

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Individual Container
```bash
# Build backend image
cd backend
docker build -t exam-proctoring-backend .

# Run container
docker run -p 5000:5000 --env-file .env exam-proctoring-backend
```

---

## 📊 Monitoring Setup

### Starting Grafana & Prometheus
```bash
# Navigate to monitoring directory
cd backend/monitoring

# Start monitoring stack
docker-compose up -d

# Access Grafana
# URL: http://localhost:3000
# Default credentials: admin/admin
```

### Metrics Endpoint
```bash
# Backend metrics available at
http://localhost:5000/metrics
```

### Generate Synthetic Load
```bash
# Run load testing script
npm run metrics:load
```

---

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend linting
cd frontend
npm run lint
```

---

## 📸 Screenshots & Demonstrations

### 1. Git Repository Initialization
<img width="1920" height="945" alt="image" src="https://github.com/user-attachments/assets/481fcb77-d058-43b1-a711-9169f6d1fbd4" />

### 2. First Commit
<img width="1375" height="508" alt="Screenshot (2407)" src="https://github.com/user-attachments/assets/4bcaa0b6-6360-43bd-bcbd-ea10d65212f5" />

### 3. Branch Creation
<img width="701" height="363" alt="Screenshot (2408)" src="https://github.com/user-attachments/assets/e8eadca1-da0d-40c1-b46e-a03ce6d008eb" />

### 4. Merge Operations
<img width="1920" height="1080" alt="Screenshot (2411)" src="https://github.com/user-attachments/assets/dac4ad5e-a525-426c-a381-a6e0b6c0e994" />

<img width="1920" height="1080" alt="Screenshot (2412)" src="https://github.com/user-attachments/assets/9338a03e-b855-4235-b53b-5bc0b5473347" />

### 5. Merge Conflict Resolution
<img width="997" height="683" alt="Screenshot 2025-12-22 151658" src="https://github.com/user-attachments/assets/2dc5e1bf-73d5-4dff-9d6e-84a55caf014c" />

### 6. Commit Graph Visualization
<img width="1920" height="1080" alt="Screenshot (2413)" src="https://github.com/user-attachments/assets/ac9715c2-4f37-4f7b-95f3-1dc9eba96eda" />

### 7. GitHub Repository Overview
<img width="1920" height="1080" alt="Screenshot (2414)" src="https://github.com/user-attachments/assets/7ce55d7f-844c-4219-9e57-016f5b08c9c9" />

<img width="1920" height="1080" alt="Screenshot (2416)" src="https://github.com/user-attachments/assets/9325f198-038c-4c8b-ae5c-926ec22d45f1" />

### 8. Commit History on GitHub
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/41fc3b8d-cdce-49d7-93c3-6f04ba2c7c53" />

### 9. Branch Network Graph
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c3afd1f0-b105-43e3-af72-7603d7d84640" />

### 10. Prometheus Metrics Endpoints
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/b52e479c-99fd-4b0c-9068-4d1889e200c2" />

### 11. Docker Container Startup
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/aab0bebd-7268-44c2-886a-44ff1fa456ef" />

### 12. Grafana Performance Dashboard
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/5088b0e7-17bf-4f2c-97b7-15da22553a21" />

---

## 🚧 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Merge Conflicts** | Carefully reviewed conflicting files, manually resolved differences, tested before committing |
| **Vim Editor Navigation** | Learned basic Vim commands (`:wq`, `:q!`, `i`, `ESC`) for merge commit messages |
| **Multiple Branch Management** | Maintained clear branch naming conventions and used `git branch -a` frequently |
| **CORS Issues** | Configured proper CORS settings with express-rate-limit and helmet |
| **Session Persistence** | Implemented connect-mongo for MongoDB session storage |
| **Real-time Communication** | Used Socket.IO with proper event handling and reconnection logic |
| **Docker Networking** | Configured docker-compose with proper service dependencies and networks |

---

## ✅ Learning Outcomes

### Git & Version Control
- ✅ Mastered Git Bash commands for daily workflows
- ✅ Understood branching strategies and their applications
- ✅ Learned conflict resolution techniques
- ✅ Practiced collaborative development with GitHub
- ✅ Implemented proper commit message conventions

### Full-Stack Development
- ✅ Built RESTful APIs with Express.js
- ✅ Implemented JWT authentication & authorization
- ✅ Created responsive React components with Tailwind
- ✅ Managed state with React Query
- ✅ Integrated real-time features with Socket.IO
- ✅ Designed MongoDB schemas and relationships

### DevOps & Monitoring
- ✅ Containerized applications with Docker
- ✅ Set up Grafana dashboards for monitoring
- ✅ Configured Prometheus metrics collection
- ✅ Implemented logging with Winston
- ✅ Performed load testing and optimization

---

## 🤝 Contributing

### Git Workflow for Contributors
```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/your-username/exam-proctoring-system.git

# 3. Create a feature branch
git checkout -b feature/your-feature-name

# 4. Make changes and commit
git add .
git commit -m "Add: your feature description"

# 5. Push to your fork
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
```

### Commit Message Convention
```
Add: New feature
Fix: Bug fix
Update: Modify existing feature
Remove: Delete code/file
Docs: Documentation changes
Style: Code formatting
Refactor: Code restructuring
Test: Add or update tests
```

---

## 📝 Additional Documentation

- **Backend API Documentation** - See [backend/README.md](./backend/README.md)
- **Deployment Guide** - See [backend/DEPLOYMENT.md](./backend/DEPLOYMENT.md)
- **Frontend Documentation** - See [frontend/README.md](./frontend/README.md)

---

## 📜 License

This project is licensed under the **ISC License**.

---

## 🏁 Conclusion

This project successfully demonstrates the integration of **advanced Git workflows** with **modern full-stack development practices**. Through hands-on experience with Git Bash, GitHub, and the MERN stack, I've gained valuable insights into:

- **Version Control Best Practices** - Branching, merging, and conflict resolution
- **Collaborative Development** - Working with multiple branches and team workflows
- **Production-Ready Applications** - Authentication, real-time features, monitoring
- **DevOps Integration** - Containerization, deployment, and observability

The combination of a real-world application with proper version control demonstrates how Git enhances development workflows, enables collaboration, and maintains code quality in professional software projects.

---

## 👨‍💻 Author

**Kunal**

---

## 🙏 Acknowledgments

- Git Documentation & Community
- MongoDB University
- React & Vite Communities
- Stack Overflow Community
- Grafana & Prometheus Projects

---

**⭐ If you found this project helpful, please consider giving it a star on GitHub!**
