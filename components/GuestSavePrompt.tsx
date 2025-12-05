
import React from 'react';
import { X, UserPlus, LogIn, AlertTriangle } from 'lucide-react';

interface GuestSavePromptProps {
  onClose: () => void;
  onSignUp: () => void; // Redirect to a full sign-up form
  onSignIn: () => void; // Redirect to the login page
}

const GuestSavePrompt: React.FC<GuestSavePromptProps> = ({ onClose, onSignUp, onSignIn }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center font-sans" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 border border-slate-700" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border-4 border-amber-500/20 rounded-full mx-auto flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-amber-400" />
            </div>

          <h2 className="text-2xl font-bold mb-2">Save Your Work</h2>
          <p className="text-slate-400 mb-8">
            To save your project and ensure you don't lose your progress, please create an account or sign in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
                onClick={onSignUp}
                className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
            >
                <UserPlus size={20} />
                Create Account
            </button>
            <button 
                onClick={onSignIn}
                className="w-full flex items-center justify-center gap-3 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-all active:scale-95"
            >
                <LogIn size={20} />
                Sign In
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-center items-center rounded-b-2xl">
            <button onClick={onClose} className="text-sm text-slate-400 hover:text-slate-300 transition-colors">
                Continue as Guest (without saving)
            </button>
        </div>
      </div>
    </div>
  );
};

export default GuestSavePrompt;
