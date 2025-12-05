
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
    <Routes>
      {/* Public Share Route - Accessible by anyone */}
      <Route path="/share/:projectId" element={<ShareViewer />} />

      {user ? (
        <>
          <Route path="/" element={<Dashboard user={user} onSignOut={logout} />} />
          <Route path="/editor/:projectId" element={<Editor user={user} onSignOut={logout} />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </>
      )}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
