import React from 'react';
import { Film, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MovieCardProps {
  id: number;
  index: number;
  script: string;
  sound: string;
  aspectRatio: string;
  onUpdate: (field: 'script' | 'sound', value: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ id, index, script, sound, aspectRatio, onUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  // Calculate inline style for aspect ratio if it's not a standard Tailwind class
  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '16:9': return { aspectRatio: '16/9' };
      case '4:3': return { aspectRatio: '4/3' };
      case '1:1': return { aspectRatio: '1/1' };
      case '9:16': return { aspectRatio: '9/16' };
      default: return { aspectRatio: '16/9' };
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="group relative w-full flex flex-col touch-none"
    >
      <div 
        style={getAspectRatioStyle()}
        className="w-full bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-700 transition-all duration-300 ease-out hover:border-indigo-500/50 relative"
      >
        
        {/* Frame Number Badge - Top Left */}
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-bold rounded shadow-sm pointer-events-none border border-indigo-400/20">
          #{index + 1}
        </div>

        {/* Drag Handle - Top Right */}
        <button
          className="absolute top-2 right-2 z-20 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white/70 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Screen Content Simulation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 transition-colors duration-300 group-hover:text-indigo-400">
          <Film className="w-12 h-12 mb-3 opacity-50 group-hover:opacity-100 transition-opacity" />
          <span className="text-sm font-medium tracking-wide uppercase opacity-70">
            Shot {index + 1}
          </span>
        </div>

        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Inputs for Script and Sound */}
      <div className="mt-4 space-y-3 px-1">
        
        {/* Script Input */}
        <div>
           <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider flex justify-between">
             Script
           </label>
           <textarea
             rows={2}
             value={script}
             onChange={(e) => onUpdate('script', e.target.value)}
             className="w-full bg-slate-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
             placeholder="Action & Dialogue..."
           />
        </div>

        {/* Sound Input */}
        <div className="relative">
           <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
             Sound
           </label>
           <input
             type="text"
             value={sound}
             onChange={(e) => onUpdate('sound', e.target.value)}
             className="w-full bg-slate-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
             placeholder="SFX / Music..."
           />
        </div>

      </div>
    </div>
  );
};

export default MovieCard;