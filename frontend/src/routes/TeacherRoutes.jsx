import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherSignup from '../components/auth/TeacherSignup';
import TeacherLogin from '../components/auth/TeacherLogin';
import TeacherDashboard from '../pages/Teacher/Dashboard';
import { teacherAuthAPI } from '../services/api/authAPI';

const TeacherRoutes = () => {
  const isAuthenticated = teacherAuthAPI.isAuthenticated();

  return (
    <Routes>
      <Route path="register" element={<TeacherSignup />} />
      <Route path="login" element={<TeacherLogin />} />
      <Route 
        path="dashboard" 
        element={
          isAuthenticated ? <TeacherDashboard /> : <Navigate to="/auth/teacher-login" />
        } 
      />
    </Routes>
  );
};

export default TeacherRoutes;