import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Separate component to consume the Context
const AppRoutes: React.FC = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // If not authenticated, show Login
  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard user={user} onSignOut={logout} />} />
        <Route path="/editor/:projectId" element={<Editor user={user} onSignOut={logout} />} />
        {/* Redirect unknown routes to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
