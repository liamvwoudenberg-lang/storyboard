import React from 'react';
import { Clapperboard, LogOut, Menu, Play, ChevronLeft, Share2 } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  user?: User | null;
  onSignOut?: () => void;
  onToggleSidebar: () => void;
  onPresent: () => void;
  onBackToDashboard: () => void;
  onShare: () => void; // New prop to open the share modal
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onSignOut, 
  onToggleSidebar, 
  onPresent,
  onBackToDashboard,
  onShare,
  isSidebarOpen
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-lg bg-slate-900/90 border-b border-gray-800 transition-all duration-300">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleSidebar}
              className={`p-2 rounded-lg text-gray-400 hover:text-white hover:bg-slate-800 transition-colors ${!isSidebarOpen ? 'bg-slate-800/50' : ''}`}
              title="Toggle Sidebar"
            >
              <Menu size={20} />
            </button>
            
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={onBackToDashboard}
              title="Back to Dashboard"
            >
              <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20 group-hover:bg-indigo-500 transition-colors">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 hidden sm:block group-hover:to-white transition-all">
                Storybored
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
             <button 
                onClick={onBackToDashboard}
                className="hidden md:flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors mr-2"
             >
               <ChevronLeft size={14} />
               Dashboard
             </button>

             {/* Share Button (now opens modal) */}
              <button
                 onClick={onShare}
                 className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all text-sm font-semibold shadow-lg shadow-indigo-600/20"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Share</span>
              </button>

             <button
                onClick={onPresent}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-600/50 rounded-lg transition-all text-sm font-medium"
             >
               <Play size={16} fill="currentColor" />
               <span className="hidden sm:inline">Present</span>
             </button>

             <div className="h-6 w-px bg-slate-800 mx-1"></div>

             {user ? (
               <div className="flex items-center gap-3">
                 <div className="flex items-center gap-3 py-1 px-2 rounded-full hover:bg-slate-800 transition-colors cursor-default">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-7 h-7 rounded-full border border-gray-600" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-indigo-400/30 flex items-center justify-center text-xs font-bold text-white">
                        {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-300 hidden md:block max-w-[100px] truncate">
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
