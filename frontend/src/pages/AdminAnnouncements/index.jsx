import React, { useState } from 'react';
import { FaBullhorn, FaPaperPlane, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import AdminDashboard from '../AdminDashboard';
import StudentFilter from '../../components/StudentFilter';
import TeacherFilter from '../../components/TeacherFilter';
import { announcementAPI } from '../../services/api/announcementAPI';

const AdminAnnouncements = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [includeStudents, setIncludeStudents] = useState(false);
  const [includeTeachers, setIncludeTeachers] = useState(false);
  const [studentTargetType, setStudentTargetType] = useState('all'); // 'all' or 'specific'
  const [teacherTargetType, setTeacherTargetType] = useState('all'); // 'all' or 'specific'
  const [studentFilters, setStudentFilters] = useState([]);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!description.trim()) {
      setError('Description is required.');
      return;
    }

    if (!includeStudents && !includeTeachers) {
      setError('Please select at least one recipient type (Students or Teachers).');
      return;
    }

    if (includeStudents && studentTargetType === 'specific' && studentFilters.length === 0) {
      setError('Please add at least one student filter when selecting specific students.');
      return;
    }

    if (includeTeachers && teacherTargetType === 'specific' && selectedTeachers.length === 0) {
      setError('Please select at least one teacher when selecting specific teachers.');
      return;
    }

    // Determine targetAudience and targetType based on selections
    let targetAudience = 'all';
    let targetType = 'all';
    let studentFiltersToSend = [];
    let teacherIds = [];

    if (includeStudents && !includeTeachers) {
      // Only students selected
      targetAudience = 'students';
      targetType = studentTargetType;
      if (studentTargetType === 'specific') {
        studentFiltersToSend = studentFilters;
      }
    } else if (includeTeachers && !includeStudents) {
      // Only teachers selected
      targetAudience = 'teachers';
      targetType = teacherTargetType;
      if (teacherTargetType === 'specific') {
        teacherIds = selectedTeachers.map((t) => t._id || t.id).filter(Boolean);
      }
    } else {
      // Both selected
      targetAudience = 'all';
      
      // If both are "all", use "all"
      // If both are "specific", use "specific" with both filters
      // If one is "all" and one is "specific", we need to handle it differently
      const studentsIsSpecific = studentTargetType === 'specific';
      const teachersIsSpecific = teacherTargetType === 'specific';
      
      if (studentsIsSpecific && teachersIsSpecific) {
        // Both specific
        targetType = 'specific';
        studentFiltersToSend = studentFilters;
        teacherIds = selectedTeachers.map((t) => t._id || t.id).filter(Boolean);
      } else if (!studentsIsSpecific && !teachersIsSpecific) {
        // Both all
        targetType = 'all';
      } else {
        // Mixed: one all, one specific
        // For backend compatibility, we'll send as "all" with targetType "specific"
        // but only include filters for the specific group
        targetType = 'specific';
        if (studentsIsSpecific) {
          studentFiltersToSend = studentFilters;
        }
        if (teachersIsSpecific) {
          teacherIds = selectedTeachers.map((t) => t._id || t.id).filter(Boolean);
        }
      }
    }

    setLoading(true);
    try {
      const announcementData = {
        title: title.trim(),
        description: description.trim(),
        targetAudience,
        targetType,
        studentFilters: studentFiltersToSend,
        teacherIds,
      };

      const result = await announcementAPI.createAnnouncement(announcementData);
      
      const studentsCount = result?.targetStudentsCount ?? result?.data?.targetStudentsCount ?? 0;
      const teachersCount = result?.targetTeachersCount ?? result?.data?.targetTeachersCount ?? 0;
      
      setSuccess(
        `Announcement created successfully! Sent to ${studentsCount} ${studentsCount === 1 ? 'student' : 'students'} and ${teachersCount} ${teachersCount === 1 ? 'teacher' : 'teachers'}.`
      );

      // Reset form
      setTitle('');
      setDescription('');
      setIncludeStudents(false);
      setIncludeTeachers(false);
      setStudentTargetType('all');
      setTeacherTargetType('all');
      setStudentFilters([]);
      setSelectedTeachers([]);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminDashboard
        activeKey="announcements"
        overrideContent={
          <main className="p-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <FaBullhorn className="text-sky-600 text-2xl" />
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">Create Announcement</h1>
                    <p className="text-sm text-slate-600">Send announcements to students and teachers</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
                    placeholder="Enter announcement title"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                    placeholder="Enter announcement description"
                    required
                  />
                </div>

                {/* Recipients Section */}
                <div className="border-t border-slate-200 pt-6">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Recipients</h2>

                  {/* Students Option */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="include-students"
                        checked={includeStudents}
                        onChange={(e) => {
                          setIncludeStudents(e.target.checked);
                          if (!e.target.checked) {
                            setStudentTargetType('all');
                            setStudentFilters([]);
                          }
                        }}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                      />
                      <label htmlFor="include-students" className="text-sm font-medium text-slate-700">
                        Students
                      </label>
                    </div>

                    {includeStudents && (
                      <div className="ml-7 space-y-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="student-target"
                              value="all"
                              checked={studentTargetType === 'all'}
                              onChange={(e) => {
                                setStudentTargetType('all');
                                setStudentFilters([]);
                              }}
                              className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">All Students</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="student-target"
                              value="specific"
                              checked={studentTargetType === 'specific'}
                              onChange={(e) => setStudentTargetType('specific')}
                              className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Specific Students</span>
                          </label>
                        </div>

                        {studentTargetType === 'specific' && (
                          <StudentFilter
                            onStudentsSelected={setStudentFilters}
                            selectedFilters={studentFilters}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Teachers Option */}
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-3 mb-4">
                      <input
                        type="checkbox"
                        id="include-teachers"
                        checked={includeTeachers}
                        onChange={(e) => {
                          setIncludeTeachers(e.target.checked);
                          if (!e.target.checked) {
                            setTeacherTargetType('all');
                            setSelectedTeachers([]);
                          }
                        }}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                      />
                      <label htmlFor="include-teachers" className="text-sm font-medium text-slate-700">
                        Teachers
                      </label>
                    </div>

                    {includeTeachers && (
                      <div className="ml-7 space-y-4">
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="teacher-target"
                              value="all"
                              checked={teacherTargetType === 'all'}
                              onChange={(e) => {
                                setTeacherTargetType('all');
                                setSelectedTeachers([]);
                              }}
                              className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">All Teachers</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="teacher-target"
                              value="specific"
                              checked={teacherTargetType === 'specific'}
                              onChange={(e) => setTeacherTargetType('specific')}
                              className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-500"
                            />
                            <span className="text-sm text-slate-700">Specific Teachers</span>
                          </label>
                        </div>

                        {teacherTargetType === 'specific' && (
                          <TeacherFilter
                            onTeachersSelected={setSelectedTeachers}
                            selectedTeachers={selectedTeachers}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                    <FaExclamationTriangle />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                    <FaCheckCircle />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-60 flex items-center space-x-2 font-medium"
                  >
                    <FaPaperPlane />
                    <span>{loading ? 'Sending...' : 'Send Announcement'}</span>
                  </button>
                </div>
              </form>
            </div>
          </main>
        }
      />
    </div>
  );
};

export default AdminAnnouncements;

