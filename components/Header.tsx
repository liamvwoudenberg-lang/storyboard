import React, { useState } from 'react';
import { Clapperboard, LogOut, Menu, Play, ChevronLeft, Share2, Copy, Check } from 'lucide-react';
import { User } from 'firebase/auth';
import { useParams } from 'react-router-dom';

interface HeaderProps {
  user?: User | null;
  onSignOut?: () => void;
  onToggleSidebar: () => void;
  onPresent: () => void;
  onBackToDashboard: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  user, 
  onSignOut, 
  onToggleSidebar, 
  onPresent,
  onBackToDashboard,
  isSidebarOpen
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    if (!projectId) return;
    const url = `${window.location.origin}/share/${projectId}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

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

             {/* Share Button (Only visible if projectId is present, i.e., in Editor) */}
             {projectId && (
                <div className="relative">
                   <button
                      onClick={() => setShowShareTooltip(!showShareTooltip)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700 rounded-lg transition-all text-sm font-medium"
                   >
                     <Share2 size={16} />
                     <span className="hidden sm:inline">Share</span>
                   </button>
                   
                   {showShareTooltip && (
                      <div className="absolute top-full mt-2 right-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2">
                         <p className="text-xs text-gray-400">Share this read-only link:</p>
                         <div className="flex gap-2">
                            <input 
                              readOnly 
                              value={`${window.location.origin}/share/${projectId}`}
                              className="flex-1 bg-slate-950 text-xs text-gray-300 px-2 py-1 rounded border border-slate-700 focus:outline-none"
                            />
                            <button 
                              onClick={handleCopyLink}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded transition-colors"
                              title="Copy Link"
                            >
                              {isCopied ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                         </div>
                      </div>
                   )}
                </div>
             )}

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