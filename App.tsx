
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import ShareViewer from './components/ShareViewer';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import NotFound from './components/NotFound';
import ForgotPassword from './components/ForgotPassword';
import StagingGuard from './components/StagingGuard';

const App: React.FC = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <StagingGuard>
      <Routes>
        {/* Public routes accessible to everyone */}
        <Route path="/share/:projectId" element={<ShareViewer />} />

        {/* Auth routes */}
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />

        {/* Protected routes */}
        <Route 
          path="/" 
          element={user ? <Dashboard user={user} onSignOut={logout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/editor/:projectId" 
          element={user ? <Editor user={user} onSignOut={logout} /> : <Navigate to="/login" replace />} 
        />

        {/* Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </StagingGuard>
  );
};

export default App;
