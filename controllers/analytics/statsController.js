const logger = require('../../utils/helpers/logger');
const ApiResponse = require('../../utils/helpers/apiResponse');

/**
 * Stats Controller
 * Handles statistics and analytics endpoints
 */
class StatsController {
  constructor() {
    // Bind methods to maintain 'this' context
    this.getHomeStats = this.getHomeStats.bind(this);
    this.getPlatformAnalytics = this.getPlatformAnalytics.bind(this);
    this.getLiveStats = this.getLiveStats.bind(this);
  }

  /**
   * @desc    Get home page statistics
   * @route   GET /api/v1/stats/home
   * @access  Public
   */
  async getHomeStats(req, res, next) {
    try {
      // In production, fetch from database
      // For now, return mock data with real-time calculations
      const stats = await this.calculateHomeStats();
      
      logger.info('Home stats fetched successfully');
      
      res.status(200).json(new ApiResponse(200, stats, 'Home statistics retrieved'));
    } catch (error) {
      logger.error('Error fetching home stats:', error);
      logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Ensure CORS headers are set on error
      const origin = req.headers.origin;
      if (origin) {
        const allowedOrigins = process.env.FRONTEND_URL 
          ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
          : ['http://localhost:5173', 'https://virtualxam-fp5e.onrender.com'];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
          res.setHeader('Access-Control-Allow-Origin', origin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
        }
      }
      
      res.status(500).json(new ApiResponse(500, null, 'Failed to fetch statistics'));
    }
  }

  /**
   * @desc    Get platform analytics
   * @route   GET /api/v1/stats/analytics
   * @access  Public
   */
  async getPlatformAnalytics(req, res, next) {
    try {
      const { period = 'monthly' } = req.query;
      
      const analytics = await this.calculateAnalytics(period);
      
      logger.info(`Analytics fetched for period: ${period}`);
      
      return res.status(200).json(new ApiResponse(200, analytics, 'Analytics retrieved'));
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Failed to fetch analytics'));
    }
  }

  /**
   * @desc    Get live statistics
   * @route   GET /api/v1/stats/live
   * @access  Public
   */
  async getLiveStats(req, res, next) {
    try {
      // In production, fetch from Redis cache or real-time database
      const liveStats = await this.getRealTimeStats();
      
      // Set cache headers for real-time data
      res.set('Cache-Control', 'no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      return res.status(200).json(new ApiResponse(200, liveStats, 'Live statistics retrieved'));
    } catch (error) {
      logger.error('Error fetching live stats:', error);
      return res.status(500).json(new ApiResponse(500, null, 'Failed to fetch live statistics'));
    }
  }

  // Helper methods
  async calculateHomeStats() {
    try {
      // This would typically query your database
      // For now, return mock data with some randomization for realism
      const now = new Date();
      
      return {
        platformStats: [
          { 
            label: 'Active Exams', 
            value: this.formatNumber(Math.floor(Math.random() * 2000) + 1500),
            icon: 'chart', // Use text instead of emoji to avoid serialization issues
            trend: '+12%'
          },
          { 
            label: 'Total Students', 
            value: '25,000+',
            icon: 'users',
            trend: '+8%'
          },
          { 
            label: 'Institutions', 
            value: '500+',
            icon: 'building',
            trend: '+15%'
          },
          { 
            label: 'Success Rate', 
            value: '99.8%',
            icon: 'target',
            trend: '+0.2%'
          },
        ],
        recentActivity: [
          { 
            type: 'exam_started', 
            count: Math.floor(Math.random() * 200) + 100,
            time: '2 hours ago'
          },
          { 
            type: 'exam_completed', 
            count: Math.floor(Math.random() * 150) + 50,
            time: '5 hours ago'
          },
          { 
            type: 'user_registered', 
            count: Math.floor(Math.random() * 100) + 20,
            time: 'Today'
          },
        ],
        performanceMetrics: {
          avgCompletionTime: '45min',
          avgScore: '82%',
          satisfactionRate: '96%',
          systemUptime: '99.99%',
        },
        timestamp: now.toISOString(),
        cacheTTL: 300 // 5 minutes
      };
    } catch (error) {
      logger.error('Error in calculateHomeStats:', error);
      throw error; // Re-throw to be caught by getHomeStats
    }
  }

  async calculateAnalytics(period) {
    // Generate time series data based on period
    const data = this.generateTimeSeriesData(period);
    
    return {
      period,
      data,
      summary: {
        totalExams: data.reduce((sum, item) => sum + item.exams, 0),
        totalStudents: data.reduce((sum, item) => sum + item.students, 0),
        avgScore: this.calculateAverage(data.map(item => item.avgScore)),
        completionRate: '94%',
      },
      updatedAt: new Date().toISOString()
    };
  }

  async getRealTimeStats() {
    // Simulate real-time data
    return {
      activeSessions: Math.floor(Math.random() * 500) + 300,
      concurrentUsers: Math.floor(Math.random() * 2000) + 1500,
      examsInProgress: Math.floor(Math.random() * 200) + 100,
      alertsInLastHour: Math.floor(Math.random() * 50),
      systemLoad: Math.random() * 30 + 10, // 10-40%
      responseTime: Math.random() * 50 + 50, // 50-100ms
      timestamp: new Date().toISOString(),
    };
  }

  // Utility methods
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  calculateAverage(numbers) {
    const sum = numbers.reduce((a, b) => a + b, 0);
    return (sum / numbers.length).toFixed(1);
  }

  generateTimeSeriesData(period) {
    const data = [];
    const now = new Date();
    
    let labels, count;
    
    switch (period) {
      case 'daily':
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        count = 24;
        break;
      case 'weekly':
        labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        count = 7;
        break;
      case 'monthly':
        labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
        count = 30;
        break;
      default:
        labels = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`);
        count = 12;
    }
    
    for (let i = 0; i < count; i++) {
      data.push({
        label: labels[i],
        exams: Math.floor(Math.random() * 500) + 200,
        students: Math.floor(Math.random() * 1000) + 500,
        avgScore: Math.floor(Math.random() * 20) + 70, // 70-90%
        completionRate: Math.random() * 10 + 90, // 90-100%
      });
    }
    
    return data;
  }
}

module.exports = new StatsController();