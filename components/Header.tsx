import React from 'react';
import { Clapperboard } from 'lucide-react';

const Header: React.FC = () => {
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
             <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Movies
             </button>
             <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Series
             </button>
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-indigo-400/30"></div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;