
import React, { useRef, useState } from 'react';
import { Film, GripVertical, Trash2, Upload, Music, Play, Pause, Image as ImageIcon } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import imageCompression from 'browser-image-compression';

interface MovieCardProps {
  id: string | number;
  index: number;
  script: string;
  sound: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  aspectRatio: string;
  onUpdate: (field: 'script' | 'sound' | 'imageUrl' | 'videoUrl' | 'audioUrl', value: string) => void;
  onDelete: () => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ 
  id, 
  index, 
  script, 
  sound, 
  imageUrl, 
  videoUrl, 
  audioUrl, 
  aspectRatio, 
  onUpdate, 
  onDelete 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isProcessing, setIsProcessing] = useState(false);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const getAspectRatioStyle = () => {
    switch (aspectRatio) {
      case '16:9': return { aspectRatio: '16/9' };
      case '4:3': return { aspectRatio: '4/3' };
      case '1:1': return { aspectRatio: '1/1' };
      case '9:16': return { aspectRatio: '9/16' };
      default: return { aspectRatio: '16/9' };
    }
  };

  // --- File Handling ---

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      if (file.type.startsWith('image/')) {
        // Compress Image
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 800,
          useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        // Create DataURL (or use ObjectURL if preferred, but DataURL is more persistent for state updates here)
        const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
        
        onUpdate('imageUrl', dataUrl);
        onUpdate('videoUrl', ''); // Clear video if image selected
      } else if (file.type.startsWith('video/')) {
        // Validate Video Size
        if (file.size > 5 * 1024 * 1024) { // 5MB
          alert("Video must be under 5MB for performance.");
          setIsProcessing(false);
          return;
        }
        // Create Object URL for preview
        const vidUrl = URL.createObjectURL(file);
        onUpdate('videoUrl', vidUrl);
        onUpdate('imageUrl', ''); // Clear image if video selected
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert("Failed to upload file.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate Audio Size
    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert("Audio must be under 2MB.");
      return;
    }

    const audUrl = URL.createObjectURL(file);
    onUpdate('audioUrl', audUrl);
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
        
        {/* Frame Number Badge */}
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-bold rounded shadow-sm pointer-events-none border border-indigo-400/20">
          #{index + 1}
        </div>

        {/* Drag Handle */}
        <button
          className="absolute top-2 right-2 z-20 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white/70 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
          {...attributes}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </button>

        {/* Media Content Area */}
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
           {videoUrl ? (
             <video 
               src={videoUrl} 
               className="w-full h-full object-cover"
               muted 
               loop 
               playsInline
               onMouseEnter={(e) => e.currentTarget.play()}
               onMouseLeave={(e) => e.currentTarget.pause()}
             />
           ) : imageUrl ? (
             <img 
               src={imageUrl} 
               alt="Storyboard Frame" 
               className="w-full h-full object-cover"
             />
           ) : (
             <div className="flex flex-col items-center justify-center text-gray-600 group-hover:text-indigo-400/50 transition-colors">
               <Film className="w-12 h-12 mb-3 opacity-30" />
               <span className="text-xs uppercase tracking-widest opacity-50 font-medium">Empty Frame</span>
             </div>
           )}
           
           {/* Upload Overlay Button */}
           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
             <button 
               onClick={() => mediaInputRef.current?.click()}
               disabled={isProcessing}
               className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-xl transform scale-95 hover:scale-100 transition-all"
             >
               {isProcessing ? (
                 <span className="animate-pulse">Processing...</span>
               ) : (
                 <>
                  <Upload size={16} /> 
                  {imageUrl || videoUrl ? 'Change Media' : 'Upload Media'}
                 </>
               )}
             </button>
             <input 
               type="file" 
               ref={mediaInputRef} 
               onChange={handleMediaUpload} 
               accept="image/*,video/*" 
               className="hidden" 
             />
           </div>
        </div>

      </div>

      {/* Inputs for Script and Sound */}
      <div className="mt-4 space-y-3 px-1">
        
        {/* Script Input */}
        <div>
           <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
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

        {/* Sound Input & Audio Upload */}
        <div className="relative">
           <label className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
             <span>Sound</span>
             {audioUrl && <span className="text-emerald-500 flex items-center gap-1"><Music size={10} /> Audio Linked</span>}
           </label>
           
           <div className="flex gap-2">
             <input
               type="text"
               value={sound}
               onChange={(e) => onUpdate('sound', e.target.value)}
               className="flex-1 bg-slate-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
               placeholder="SFX Description..."
             />
             
             {/* Audio Player / Upload Button */}
             <div className="flex-shrink-0">
               {audioUrl ? (
                 <div className="relative group/audio">
                   <audio src={audioUrl} controls className="hidden" id={`audio-${id}`} />
                   <button 
                     onClick={() => {
                        const audio = document.getElementById(`audio-${id}`) as HTMLAudioElement;
                        if (audio.paused) audio.play(); else audio.pause();
                     }}
                     className="h-full px-3 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-600/50 flex items-center justify-center transition-all"
                     title="Play/Pause SFX"
                   >
                     <Play size={16} fill="currentColor" />
                   </button>
                   <button 
                     onClick={() => onUpdate('audioUrl', '')}
                     className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/audio:opacity-100 transition-opacity scale-75 shadow-sm"
                     title="Remove Audio"
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={() => audioInputRef.current?.click()}
                   className="h-full px-3 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-indigo-400 rounded-lg border border-gray-700 transition-all"
                   title="Upload Audio"
                 >
                   <Music size={16} />
                 </button>
               )}
               <input 
                 type="file" 
                 ref={audioInputRef} 
                 onChange={handleAudioUpload} 
                 accept="audio/*" 
                 className="hidden" 
               />
             </div>
           </div>
        </div>

        {/* Bottom Toolbar (Delete) */}
        <div className="flex justify-end pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-medium"
            title="Delete Frame"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default MovieCard;
