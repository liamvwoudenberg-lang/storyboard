import React from 'react';
import { Clapperboard, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user?: User | null;
  onSignOut?: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onSignOut }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-lg bg-slate-900/80 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <Clapperboard className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              CinemaGrid
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {user ? (
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-3 bg-slate-800/50 py-1.5 px-3 rounded-full border border-slate-700/50">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-6 h-6 rounded-full border border-gray-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-indigo-400/30"></div>
                    )}
                    <span className="text-sm font-medium text-gray-300 hidden sm:block max-w-[100px] truncate">
                      {user.displayName || (user.isAnonymous ? 'Guest' : 'Creator')}
                    </span>
                 </div>
                 
                 {onSignOut && (
                   <button 
                    onClick={onSignOut}
                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Sign Out"
                   >
                     <LogOut size={18} />
                   </button>
                 )}
               </div>
             ) : (
               <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse"></div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;