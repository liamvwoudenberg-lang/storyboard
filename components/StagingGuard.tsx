
import React, { useState, useEffect } from 'react';

const STAGING_PASSWORD = 'password'; // In a real app, use environment variables.
const SESSION_KEY = 'staging_authenticated';

interface StagingGuardProps {
  children: React.ReactNode;
}

const StagingGuard: React.FC<StagingGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check session storage to see if user is already authenticated in this session
    const sessionAuth = sessionStorage.getItem(SESSION_KEY);
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === STAGING_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center font-sans">
      <div className="max-w-sm w-full p-8 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-white">Development Access</h1>
        <p className="text-slate-400 mb-6 text-center text-sm">Enter the password to continue.</p>
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-4">
            <label htmlFor="password-input" className="sr-only">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          {error && <p className="text-red-400 text-xs text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full mt-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
};

export default StagingGuard;
