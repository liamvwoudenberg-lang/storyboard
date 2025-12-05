import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Plus, Film, Clock, MoreVertical, LogOut, Loader2 } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const navigate = useNavigate();
  const { docs: projects, isLoading } = useFirestore('storyboards');

  const handleCreateNew = async () => {
    try {
      const newProject = await addDoc(collection(db, 'storyboards'), {
        title: 'Untitled Storyboard',
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        lastEdited: serverTimestamp(),
        sequences: [
          {
            id: `seq_${Date.now()}`,
            title: 'Scene 1',
            frames: []
          }
        ],
        aspectRatio: '16:9'
      });
      navigate(`/editor/${newProject.id}`);
    } catch (error) {
      console.error("Error creating new storyboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/20">
              <Film className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              CinemaGrid
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 py-1 px-2 rounded-full border border-gray-800 bg-slate-900">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                    {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}
                <span className="text-sm font-medium text-gray-300 pr-2">
                  {user.displayName || (user.isAnonymous ? 'Guest' : 'Creator')}
                </span>
             </div>
             <button 
               onClick={onSignOut}
               className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
               title="Sign Out"
             >
               <LogOut size={18} />
             </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Recent Projects</h2>
            <p className="text-slate-400 text-sm">Pick up where you left off</p>
          </div>
          <button 
            onClick={handleCreateNew}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Create New Board
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Create New Card (Mobile/Grid version) */}
            <button 
              onClick={handleCreateNew}
              className="group flex flex-col items-center justify-center h-64 rounded-xl border-2 border-dashed border-gray-800 bg-slate-900/30 hover:bg-slate-900 hover:border-indigo-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 group-hover:text-indigo-400 flex items-center justify-center mb-4 transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-indigo-400" />
              </div>
              <span className="font-medium text-gray-300 group-hover:text-white">Create New Project</span>
            </button>

            {/* Project Cards */}
            {projects.map((proj) => (
              <div 
                key={proj.id}
                onClick={() => navigate(`/editor/${proj.id}`)}
                className="group relative bg-slate-900 rounded-xl border border-gray-800 hover:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-64 flex flex-col"
              >
                {/* Thumbnail Placeholder */}
                <div className="h-40 bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-30 group-hover:opacity-40 transition-opacity">
                    <Film className="w-12 h-12 text-gray-600" />
                  </div>
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-60"></div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors truncate">
                      {proj.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
                      <Clock size={12} />
                      <span>Edited {new Date(proj.lastEdited?.toDate()).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-800/50">
                    <span className="text-xs font-medium text-gray-400 bg-slate-800 px-2 py-1 rounded">
                      {proj.frames?.length || 0} frames
                    </span>
                    <button className="text-gray-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors">
                      <MoreVertical size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
