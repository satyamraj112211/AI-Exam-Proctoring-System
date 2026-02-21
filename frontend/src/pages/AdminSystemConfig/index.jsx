import React, { useState, useEffect } from 'react';
import {
  FaCog,
  FaSave,
  FaUndo,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaShieldAlt,
  FaEnvelope,
  FaBell,
  FaVideo,
  FaGraduationCap,
  FaServer,
} from 'react-icons/fa';
import AdminDashboard from '../AdminDashboard';
import { systemConfigAPI } from '../../services/api/systemConfigAPI';

const AdminSystemConfig = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('exam');
  const [config, setConfig] = useState({
    examSettings: {
      defaultDuration: 60,
      defaultPassingMarks: 40,
      maxExamDuration: 180,
      minExamDuration: 15,
      autoSubmitOnTabSwitch: false,
      maxWarningsBeforeSubmit: 3,
      allowTabSwitch: true,
      detectDevTools: true,
    },
    proctoringSettings: {
      screenSharingEnabled: true,
      videoProctoringEnabled: false,
      screenCaptureQuality: 'medium',
      screenCaptureInterval: 250,
      antiCheatSensitivity: 'medium',
    },
    notificationSettings: {
      emailNotificationsEnabled: true,
      smsNotificationsEnabled: false,
      notifyOnExamStart: true,
      notifyOnExamEnd: true,
      notifyOnResults: true,
    },
    securitySettings: {
      sessionTimeout: 480,
      maxLoginAttempts: 5,
      passwordResetExpiry: 24,
      jwtTokenExpiry: '7d',
      requireEmailVerification: true,
    },
    systemSettings: {
      maintenanceMode: false,
      maintenanceMessage: 'System is under maintenance. Please try again later.',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      maxFileUploadSize: 5,
    },
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: 'VirtualXam',
    },
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await systemConfigAPI.getSystemConfig();
      if (data) {
        setConfig({
          examSettings: { ...config.examSettings, ...data.examSettings },
          proctoringSettings: { ...config.proctoringSettings, ...data.proctoringSettings },
          notificationSettings: { ...config.notificationSettings, ...data.notificationSettings },
          securitySettings: { ...config.securitySettings, ...data.securitySettings },
          systemSettings: { ...config.systemSettings, ...data.systemSettings },
          emailSettings: { ...config.emailSettings, ...data.emailSettings },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load system configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await systemConfigAPI.updateSystemConfig(config);
      setSuccess('System configuration saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save system configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all configuration to defaults? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await systemConfigAPI.resetSystemConfig();
      if (data) {
        setConfig({
          examSettings: { ...config.examSettings, ...data.examSettings },
          proctoringSettings: { ...config.proctoringSettings, ...data.proctoringSettings },
          notificationSettings: { ...config.notificationSettings, ...data.notificationSettings },
          securitySettings: { ...config.securitySettings, ...data.securitySettings },
          systemSettings: { ...config.systemSettings, ...data.systemSettings },
          emailSettings: { ...config.emailSettings, ...data.emailSettings },
        });
      }
      setSuccess('System configuration reset to defaults successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reset system configuration.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'exam', label: 'Exam Settings', icon: FaGraduationCap },
    { id: 'proctoring', label: 'Proctoring', icon: FaVideo },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'system', label: 'System', icon: FaServer },
    { id: 'email', label: 'Email/SMTP', icon: FaEnvelope },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard
        activeKey="config"
        overrideContent={
          <main className="p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaCog className="text-sky-600 text-2xl" />
                    <div>
                      <h1 className="text-2xl font-semibold text-slate-900">System Configuration</h1>
                      <p className="text-sm text-slate-600">Manage system-wide settings and preferences</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleReset}
                      disabled={saving || loading}
                      className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60 flex items-center space-x-2"
                    >
                      <FaUndo />
                      <span>Reset to Defaults</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving || loading}
                      className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60 flex items-center space-x-2 font-medium"
                    >
                      <FaSave />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
                <div className="flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'bg-white text-sky-600 shadow-sm'
                            : 'text-slate-600 hover:bg-white/50'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Messages */}
              {error && (
                <div className="mx-6 mt-4 flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                  <FaExclamationTriangle />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mx-6 mt-4 flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                  <FaCheckCircle />
                  <span>{success}</span>
                </div>
              )}

              {/* Content */}
              <div className="p-6">
                {loading ? (
                  <div className="text-center py-12 text-slate-500">Loading configuration...</div>
                ) : (
                  <>
                    {/* Exam Settings */}
                    {activeTab === 'exam' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaGraduationCap className="text-sky-600" />
                          <span>Exam Settings</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Default Exam Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="480"
                              value={config.examSettings.defaultDuration}
                              onChange={(e) => handleChange('examSettings', 'defaultDuration', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Default Passing Marks (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={config.examSettings.defaultPassingMarks}
                              onChange={(e) => handleChange('examSettings', 'defaultPassingMarks', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Maximum Exam Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="10"
                              max="480"
                              value={config.examSettings.maxExamDuration}
                              onChange={(e) => handleChange('examSettings', 'maxExamDuration', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Minimum Exam Duration (minutes)
                            </label>
                            <input
                              type="number"
                              min="5"
                              max="60"
                              value={config.examSettings.minExamDuration}
                              onChange={(e) => handleChange('examSettings', 'minExamDuration', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Maximum Warnings Before Auto-Submit
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={config.examSettings.maxWarningsBeforeSubmit}
                              onChange={(e) => handleChange('examSettings', 'maxWarningsBeforeSubmit', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.examSettings.autoSubmitOnTabSwitch}
                              onChange={(e) => handleChange('examSettings', 'autoSubmitOnTabSwitch', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Auto-submit exam on tab switch</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.examSettings.allowTabSwitch}
                              onChange={(e) => handleChange('examSettings', 'allowTabSwitch', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Allow tab switching (with warnings)</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.examSettings.detectDevTools}
                              onChange={(e) => handleChange('examSettings', 'detectDevTools', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Detect developer tools opening</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Proctoring Settings */}
                    {activeTab === 'proctoring' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaVideo className="text-sky-600" />
                          <span>Proctoring Settings</span>
                        </h2>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.proctoringSettings.screenSharingEnabled}
                              onChange={(e) => handleChange('proctoringSettings', 'screenSharingEnabled', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Enable screen sharing proctoring</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.proctoringSettings.videoProctoringEnabled}
                              onChange={(e) => handleChange('proctoringSettings', 'videoProctoringEnabled', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Enable video proctoring</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Screen Capture Quality
                            </label>
                            <select
                              value={config.proctoringSettings.screenCaptureQuality}
                              onChange={(e) => handleChange('proctoringSettings', 'screenCaptureQuality', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="low">Low (Faster)</option>
                              <option value="medium">Medium (Balanced)</option>
                              <option value="high">High (Better Quality)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Screen Capture Interval (ms)
                            </label>
                            <input
                              type="number"
                              min="100"
                              max="2000"
                              step="50"
                              value={config.proctoringSettings.screenCaptureInterval}
                              onChange={(e) => handleChange('proctoringSettings', 'screenCaptureInterval', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Anti-Cheat Sensitivity
                            </label>
                            <select
                              value={config.proctoringSettings.antiCheatSensitivity}
                              onChange={(e) => handleChange('proctoringSettings', 'antiCheatSensitivity', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="strict">Strict</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notification Settings */}
                    {activeTab === 'notifications' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaBell className="text-sky-600" />
                          <span>Notification Settings</span>
                        </h2>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.notificationSettings.emailNotificationsEnabled}
                              onChange={(e) => handleChange('notificationSettings', 'emailNotificationsEnabled', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Enable email notifications</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.notificationSettings.smsNotificationsEnabled}
                              onChange={(e) => handleChange('notificationSettings', 'smsNotificationsEnabled', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Enable SMS notifications</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.notificationSettings.notifyOnExamStart}
                              onChange={(e) => handleChange('notificationSettings', 'notifyOnExamStart', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Notify on exam start</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.notificationSettings.notifyOnExamEnd}
                              onChange={(e) => handleChange('notificationSettings', 'notifyOnExamEnd', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Notify on exam end</span>
                          </label>

                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.notificationSettings.notifyOnResults}
                              onChange={(e) => handleChange('notificationSettings', 'notifyOnResults', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Notify when results are published</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaShieldAlt className="text-sky-600" />
                          <span>Security Settings</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Session Timeout (minutes)
                            </label>
                            <input
                              type="number"
                              min="15"
                              max="1440"
                              value={config.securitySettings.sessionTimeout}
                              onChange={(e) => handleChange('securitySettings', 'sessionTimeout', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Maximum Login Attempts
                            </label>
                            <input
                              type="number"
                              min="3"
                              max="10"
                              value={config.securitySettings.maxLoginAttempts}
                              onChange={(e) => handleChange('securitySettings', 'maxLoginAttempts', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Password Reset Expiry (hours)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="168"
                              value={config.securitySettings.passwordResetExpiry}
                              onChange={(e) => handleChange('securitySettings', 'passwordResetExpiry', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              JWT Token Expiry
                            </label>
                            <select
                              value={config.securitySettings.jwtTokenExpiry}
                              onChange={(e) => handleChange('securitySettings', 'jwtTokenExpiry', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="1d">1 Day</option>
                              <option value="3d">3 Days</option>
                              <option value="7d">7 Days</option>
                              <option value="14d">14 Days</option>
                              <option value="30d">30 Days</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.securitySettings.requireEmailVerification}
                              onChange={(e) => handleChange('securitySettings', 'requireEmailVerification', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Require email verification for registration</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* System Settings */}
                    {activeTab === 'system' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaServer className="text-sky-600" />
                          <span>System Settings</span>
                        </h2>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.systemSettings.maintenanceMode}
                              onChange={(e) => handleChange('systemSettings', 'maintenanceMode', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Enable maintenance mode</span>
                          </label>
                        </div>

                        {config.systemSettings.maintenanceMode && (
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Maintenance Message
                            </label>
                            <textarea
                              rows={3}
                              maxLength={500}
                              value={config.systemSettings.maintenanceMessage}
                              onChange={(e) => handleChange('systemSettings', 'maintenanceMessage', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                              placeholder="Enter maintenance message..."
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Timezone
                            </label>
                            <select
                              value={config.systemSettings.timezone}
                              onChange={(e) => handleChange('systemSettings', 'timezone', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                              <option value="America/New_York">America/New_York (EST)</option>
                              <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                              <option value="Europe/London">Europe/London (GMT)</option>
                              <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Date Format
                            </label>
                            <select
                              value={config.systemSettings.dateFormat}
                              onChange={(e) => handleChange('systemSettings', 'dateFormat', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Time Format
                            </label>
                            <select
                              value={config.systemSettings.timeFormat}
                              onChange={(e) => handleChange('systemSettings', 'timeFormat', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            >
                              <option value="12h">12 Hour (AM/PM)</option>
                              <option value="24h">24 Hour</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              Max File Upload Size (MB)
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              value={config.systemSettings.maxFileUploadSize}
                              onChange={(e) => handleChange('systemSettings', 'maxFileUploadSize', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Email/SMTP Settings */}
                    {activeTab === 'email' && (
                      <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                          <FaEnvelope className="text-sky-600" />
                          <span>Email/SMTP Settings</span>
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              SMTP Host
                            </label>
                            <input
                              type="text"
                              value={config.emailSettings.smtpHost}
                              onChange={(e) => handleChange('emailSettings', 'smtpHost', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder="smtp.gmail.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              SMTP Port
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="65535"
                              value={config.emailSettings.smtpPort}
                              onChange={(e) => handleChange('emailSettings', 'smtpPort', Number(e.target.value))}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder="587"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              SMTP Username
                            </label>
                            <input
                              type="text"
                              value={config.emailSettings.smtpUsername}
                              onChange={(e) => handleChange('emailSettings', 'smtpUsername', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder="your-email@gmail.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              SMTP Password
                            </label>
                            <input
                              type="password"
                              value={config.emailSettings.smtpPassword === '***' ? '' : config.emailSettings.smtpPassword}
                              onChange={(e) => handleChange('emailSettings', 'smtpPassword', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder={config.emailSettings.smtpPassword === '***' ? 'Password is set (enter new to change)' : 'Enter password'}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              From Email Address
                            </label>
                            <input
                              type="email"
                              value={config.emailSettings.fromEmail}
                              onChange={(e) => handleChange('emailSettings', 'fromEmail', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder="noreply@virtualxam.com"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                              From Name
                            </label>
                            <input
                              type="text"
                              value={config.emailSettings.fromName}
                              onChange={(e) => handleChange('emailSettings', 'fromName', e.target.value)}
                              className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                              placeholder="VirtualXam"
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={config.emailSettings.smtpSecure}
                              onChange={(e) => handleChange('emailSettings', 'smtpSecure', e.target.checked)}
                              className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Use secure connection (TLS/SSL)</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </main>
        }
      />
    </div>
  );
};

export default AdminSystemConfig;








