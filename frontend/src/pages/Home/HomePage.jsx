import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  FaChalkboardTeacher, 
  FaUserGraduate, 
  FaShieldAlt, 
  FaVideo, 
  FaChartLine,
  FaClock,
  FaUsers,
  FaAward,
  FaPlayCircle
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { statsAPI } from '../../services/api/statsAPI';
import Header from '../../components/layout/Header/Header';
import { getCurrentSession } from '../../services/sessionManager';
import Button from '../../components/common/Button/Button';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('features');
  const [stats, setStats] = useState(null);

  // If already logged in in this browser profile, redirect straight to the
  // appropriate dashboard instead of showing the public homepage.
  useEffect(() => {
    const session = getCurrentSession();
    if (session?.dashboardPath) {
      navigate(session.dashboardPath, { replace: true });
    }
  }, [navigate]);

  // Fetch stats
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['homeStats'],
    queryFn: statsAPI.getHomeStats,
    refetchOnWindowFocus: false,
    staleTime: 300000, // 5 minutes
  });

  useEffect(() => {
    if (statsData) {
      setStats(statsData);
    }
  }, [statsData]);

  // Mock data for charts (replace with real data from API)
  const examData = [
    { name: 'Completed', value: 1250, color: '#10B981' },
    { name: 'Ongoing', value: 350, color: '#3B82F6' },
    { name: 'Scheduled', value: 200, color: '#F59E0B' },
  ];

  const performanceData = [
    { name: 'Jan', students: 400, avgScore: 75 },
    { name: 'Feb', students: 300, avgScore: 78 },
    { name: 'Mar', students: 500, avgScore: 82 },
    { name: 'Apr', students: 450, avgScore: 79 },
    { name: 'May', students: 600, avgScore: 85 },
    { name: 'Jun', students: 550, avgScore: 88 },
  ];

  const features = [
    {
      icon: <FaVideo className="feature-icon" />,
      title: 'Live Proctoring',
      description: 'Real-time video monitoring with AI-powered suspicious activity detection',
      color: 'bg-blue-500'
    },
    {
      icon: <FaShieldAlt className="feature-icon" />,
      title: 'Secure Environment',
      description: 'Browser lockdown, screen recording, and anti-cheating mechanisms',
      color: 'bg-green-500'
    },
    {
      icon: <FaChartLine className="feature-icon" />,
      title: 'Advanced Analytics',
      description: 'Detailed performance reports and insights for students and teachers',
      color: 'bg-purple-500'
    },
    {
      icon: <FaClock className="feature-icon" />,
      title: 'Flexible Scheduling',
      description: 'Schedule exams with automated reminders and time management',
      color: 'bg-yellow-500'
    },
    {
      icon: <FaUsers className="feature-icon" />,
      title: 'Multi-user Support',
      description: 'Support for students, teachers, and administrators with role-based access',
      color: 'bg-pink-500'
    },
    {
      icon: <FaAward className="feature-icon" />,
      title: 'Certification Ready',
      description: 'Generate certified results with digital signatures and verification',
      color: 'bg-red-500'
    },
  ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Professor, MIT',
      content: 'This platform has revolutionized how we conduct remote exams. The AI proctoring is incredibly accurate.',
      rating: 5
    },
    {
      name: 'John Smith',
      role: 'Student, Stanford',
      content: 'The interface is intuitive and the system is very reliable. Never had any technical issues during exams.',
      rating: 4.5
    },
    {
      name: 'University Admin',
      role: 'Harvard University',
      content: 'Scalable solution that handles thousands of concurrent exams without any performance issues.',
      rating: 5
    },
  ];

  const handleGetStarted = (role) => {
    if (role === 'student') {
      navigate('/auth/student-signup');
    } else if (role === 'teacher') {
      navigate('/auth/teacher-signup');
    } else {
      navigate('/auth/student-login');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <Header />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Advanced Exam
              <span className="text-blue-600 dark:text-blue-400"> Proctoring</span>
              <br />
              <span className="text-4xl md:text-6xl">System</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-10 max-w-3xl mx-auto"
            >
              Secure, scalable, and intelligent online examination platform 
              with AI-powered proctoring and real-time monitoring
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
            >
              <Button
  onClick={() => navigate('/auth/student-signup')}
  className="px-8 py-3 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
>
  <FaUserGraduate className="inline mr-2" />
  Start as Student
</Button>
              <Button
                onClick={() => handleGetStarted('teacher')}
                className="px-8 py-3 text-lg bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaChalkboardTeacher className="inline mr-2" />
                Start as Teacher
              </Button>
              <Button
                onClick={() => navigate('/demo')}
                className="px-8 py-3 text-lg bg-gray-800 hover:bg-gray-900 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <FaPlayCircle className="inline mr-2" />
                View Demo
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              {stats?.platformStats?.map((stat, index) => (
                <div key={index} className="text-center p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Everything you need for secure and efficient online examinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className={`inline-flex p-4 rounded-2xl ${feature.color} text-white mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Platform Analytics
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Real-time insights and performance metrics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Exam Status Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Exam Distribution
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={examData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {examData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Performance Trends
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                    />
                    <Bar dataKey="avgScore" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Institutions Worldwide
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              What our users are saying
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg"
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xl">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                  "{testimonial.content}"
                </p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(testimonial.rating)
                          ? 'text-yellow-400'
                          : testimonial.rating % 1 > 0 && i === Math.floor(testimonial.rating)
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    {testimonial.rating.toFixed(1)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Examination Process?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-3xl mx-auto">
            Join thousands of institutions using our platform for secure, 
            reliable, and efficient online examinations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleGetStarted()}
              className="px-8 py-3 text-lg bg-transparent border-2 border-black text-blue-600 hover:bg-gray-100 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
            >
              Start Free Trial
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              className="px-8 py-3 text-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-lg transition-all duration-300"
            >
              Schedule Demo
            </Button>
          </div>
          <p className="mt-6 text-blue-200">
            No credit card required • 30-day free trial • Full support included
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">Exam Proctoring</h3>
              <p className="text-gray-400">
                Advanced online examination platform with AI-powered proctoring.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/features" className="hover:text-white transition">Features</a></li>
                <li><a href="/pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="/demo" className="hover:text-white transition">Demo</a></li>
                <li><a href="/api" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="/docs" className="hover:text-white transition">Documentation</a></li>
                <li><a href="/guides" className="hover:text-white transition">Guides</a></li>
                <li><a href="/blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="/support" className="hover:text-white transition">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Email: support@examproctoring.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>Address: 123 Tech Street, San Francisco, CA</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Exam Proctoring System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;