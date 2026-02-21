import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { teacherAuthAPI } from '../../services/api/authAPI';
import TeacherChatPanel from '../../components/Chat/TeacherChatPanel';

const ChatPanel = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teacherAuthAPI.isAuthenticated()) {
      navigate('/auth/teacher-login', { replace: true });
      return;
    }

    const loadTeacher = async () => {
      try {
        const teacherData = await teacherAuthAPI.getCurrentTeacher();
        setTeacher(teacherData);
      } catch (error) {
        console.error('Error loading teacher:', error);
        navigate('/auth/teacher-login', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-600" />
      </div>
    );
  }

  if (!teacher) {
    return null;
  }

  return (
    <TeacherChatPanel
      testId={testId}
      teacherId={teacher._id || teacher.id}
      teacherName={teacher.name || `${teacher.firstName} ${teacher.lastName}`}
    />
  );
};

export default ChatPanel;








