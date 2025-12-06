
import React from 'react';
import { Film } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  sequences: { id: string; title: string; frames: any[] }[];
  onSelectScene: (sequenceId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, sequences, onSelectScene }) => {
  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto transition-all duration-300 hidden md:block h-full">
      <div className="p-4">
        <h2 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Scenes</h2>
        <div className="space-y-1">
          {sequences.map((seq, index) => (
            <button
              key={seq.id}
              onClick={() => onSelectScene(seq.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-gray-300 hover:bg-slate-800 hover:text-white group text-left"
            >
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:text-white transition-colors shrink-0">
                {index + 1}
              </div>
              <span className="truncate flex-1 font-medium">{seq.title}</span>
              <span className="text-xs text-gray-600 group-hover:text-gray-500 flex items-center gap-1">
                 <Film size={10} />
                 {seq.frames.length}
              </span>
            </button>
          ))}
          
          {sequences.length === 0 && (
             <div className="text-center py-8 text-gray-600 text-xs italic">
                No scenes added yet.
             </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
