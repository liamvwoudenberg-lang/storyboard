
import React, { useRef, useState } from 'react';
import { Film, GripVertical, Trash2, Upload, Music, Play, Pause, Image as ImageIcon, Pencil, Eraser, RotateCcw, X, Wand2, ZoomIn, ArrowRight } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import imageCompression from 'browser-image-compression';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';

interface MovieCardProps {
  id: string | number;
  index: number;
  script: string;
  sound: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  aspectRatio: string;
  drawingData?: any; // To store drawing paths
  shotType?: string;
  cameraMove?: string;
  onUpdate: (field: 'script' | 'sound' | 'imageUrl' | 'videoUrl' | 'audioUrl' | 'drawingData' | 'shotType' | 'cameraMove', value: any) => void;
  onDelete: () => void;
  readOnly?: boolean;
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
  drawingData,
  shotType,
  cameraMove,
  onUpdate, 
  onDelete,
  readOnly = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: readOnly });

  const [isProcessing, setIsProcessing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState('black');
  const [eraseMode, setEraseMode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isAIPromptVisible, setIsAIPromptVisible] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);

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
    if (readOnly) return;
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
        const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
        
        onUpdate('imageUrl', dataUrl);
        onUpdate('videoUrl', ''); // Clear video if image selected
      } else if (file.type.startsWith('video/')) {
        if (file.size > 5 * 1024 * 1024) { 
          alert("Video must be under 5MB for performance.");
          setIsProcessing(false);
          return;
        }
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
    if (readOnly) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { 
      alert("Audio must be under 2MB.");
      return;
    }

    const audUrl = URL.createObjectURL(file);
    onUpdate('audioUrl', audUrl);
  };

  // --- Drawing Logic ---

  const toggleDrawingMode = async () => {
     if (readOnly) return;
     if (isDrawingMode) {
       // Save when exiting
       if (canvasRef.current) {
          const paths = await canvasRef.current.exportPaths();
          onUpdate('drawingData', paths);
       }
     } else {
        // Load paths when entering if needed? 
        // react-sketch-canvas should handle loading via props ideally or we load manually
     }
     setIsDrawingMode(!isDrawingMode);
  };

  // --- AI Image Generation Logic ---
  
  const generateAIImage = async () => {
    if (readOnly || !aiPrompt) return;
    setIsGeneratingImage(true);
    
    try {
        const enhancedPrompt = `${aiPrompt}, black and white rough storyboard sketch style`;
        
        // Mocking return with a placeholder
        const safePrompt = encodeURIComponent(enhancedPrompt);
        const generatedUrl = `https://image.pollinations.ai/prompt/${safePrompt}`;
        
        onUpdate('imageUrl', generatedUrl);
        onUpdate('videoUrl', '');
        setIsAIPromptVisible(false);

    } catch (error) {
        console.error("AI Generation Error:", error);
        alert("Failed to generate image.");
    } finally {
        setIsGeneratingImage(false);
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
        
        {/* Frame Number Badge */}
        <div className="absolute top-2 left-2 z-20 px-2 py-1 bg-indigo-600/90 backdrop-blur-sm text-white text-xs font-bold rounded shadow-sm pointer-events-none border border-indigo-400/20">
          #{index + 1}
        </div>

        {/* Drag Handle - Only in Edit Mode */}
        {!readOnly && !isDrawingMode && (
          <button
            className="absolute top-2 right-2 z-20 p-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-md text-white/70 hover:text-white cursor-grab active:cursor-grabbing transition-colors"
            {...attributes}
            {...listeners}
            title="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
        )}

        {/* Draw Toggle - Only in Edit Mode */}
        {!readOnly && (
          <button
            onClick={toggleDrawingMode}
            className={`absolute top-2 ${isDrawingMode ? 'right-2' : 'right-10'} z-20 p-1.5 backdrop-blur-sm rounded-md transition-colors ${isDrawingMode ? 'bg-indigo-600 text-white' : 'bg-black/40 text-white/70 hover:bg-black/60 hover:text-white'}`}
            title={isDrawingMode ? "Save & Exit Drawing" : "Draw on Frame"}
          >
            {isDrawingMode ? <X size={16} /> : <Pencil size={16} />}
          </button>
        )}

        {/* Drawing Tools (Only visible in Drawing Mode) */}
        {isDrawingMode && (
          <div className="absolute top-12 right-2 z-30 flex flex-col gap-2 bg-slate-900/90 p-2 rounded-lg border border-gray-700 shadow-xl backdrop-blur-md">
             <button 
               onClick={() => { setEraseMode(false); setStrokeColor('black'); }}
               className={`w-6 h-6 rounded-full border-2 ${!eraseMode && strokeColor === 'black' ? 'border-white scale-110' : 'border-transparent'}`}
               style={{ backgroundColor: 'black' }}
               title="Black Pen"
             />
             <button 
               onClick={() => { setEraseMode(false); setStrokeColor('red'); }}
               className={`w-6 h-6 rounded-full border-2 ${!eraseMode && strokeColor === 'red' ? 'border-white scale-110' : 'border-transparent'}`}
               style={{ backgroundColor: 'red' }}
               title="Red Pen"
             />
             <button 
               onClick={() => { setEraseMode(false); setStrokeColor('blue'); }}
               className={`w-6 h-6 rounded-full border-2 ${!eraseMode && strokeColor === 'blue' ? 'border-white scale-110' : 'border-transparent'}`}
               style={{ backgroundColor: 'blue' }}
               title="Blue Pen"
             />
             <div className="h-px bg-gray-700 my-1" />
             <button 
                onClick={() => setEraseMode(!eraseMode)}
                className={`p-1 rounded ${eraseMode ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                title="Eraser"
             >
               <Eraser size={18} />
             </button>
             <button 
                onClick={() => canvasRef.current?.undo()}
                className="p-1 text-gray-400 hover:text-white"
                title="Undo"
             >
               <RotateCcw size={18} />
             </button>
          </div>
        )}

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
               className="w-full h-full object-cover pointer-events-none select-none"
             />
           ) : (
             <div className="flex flex-col items-center justify-center text-gray-600 group-hover:text-indigo-400/50 transition-colors">
               <Film className="w-12 h-12 mb-3 opacity-30" />
               <span className="text-xs uppercase tracking-widest opacity-50 font-medium">Empty Frame</span>
             </div>
           )}
           
           {/* Visual Cues for Camera Moves */}
           {cameraMove === 'Zoom In' && (
             <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                <ZoomIn className="w-24 h-24 text-white" strokeWidth={1} />
             </div>
           )}
           
           {/* Canvas Overlay */}
           <div className={`absolute inset-0 z-10 ${isDrawingMode ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'}`}>
              <ReactSketchCanvas
                ref={canvasRef}
                strokeWidth={3}
                strokeColor={strokeColor}
                canvasColor="transparent"
                eraserWidth={10}
                allowOnlyPointerType={isDrawingMode ? 'all' : 'touch'}
                style={{ border: 'none' }}
                withTimestamp={true}
                defaultPathsToLoad={drawingData || []}
              />
           </div>

           {/* Upload & AI Overlay (Only when not drawing and not read-only) */}
           {!readOnly && !isDrawingMode && (
             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 backdrop-blur-[1px] z-10">
               {isAIPromptVisible ? (
                  <div className="w-4/5 bg-slate-900 p-3 rounded-xl border border-indigo-500 shadow-2xl flex flex-col gap-2">
                     <textarea 
                       className="w-full bg-slate-800 text-white text-xs p-2 rounded resize-none focus:outline-none"
                       placeholder="Describe image..."
                       rows={2}
                       value={aiPrompt}
                       onChange={(e) => setAiPrompt(e.target.value)}
                     />
                     <div className="flex justify-between gap-2">
                        <button 
                          onClick={() => setIsAIPromptVisible(false)}
                          className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={generateAIImage}
                          disabled={isGeneratingImage || !aiPrompt}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium flex items-center gap-1"
                        >
                          {isGeneratingImage ? 'Gen...' : 'Create'}
                        </button>
                     </div>
                  </div>
               ) : (
                 <>
                   <button 
                     onClick={() => mediaInputRef.current?.click()}
                     disabled={isProcessing}
                     className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-xl transform scale-95 hover:scale-100 transition-all w-40 justify-center"
                   >
                     {isProcessing ? (
                       <span className="animate-pulse">Processing...</span>
                     ) : (
                       <>
                        <Upload size={16} /> 
                        {imageUrl || videoUrl ? 'Replace' : 'Upload'}
                       </>
                     )}
                   </button>
                   
                   {/* AI Gen Button */}
                   <button 
                     onClick={() => {
                        setAiPrompt(script || ''); // Pre-fill with script
                        setIsAIPromptVisible(true);
                     }}
                     className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 shadow-xl transform scale-95 hover:scale-100 transition-all w-40 justify-center"
                   >
                      <Wand2 size={16} />
                      Generate AI
                   </button>
                 </>
               )}

               <input 
                 type="file" 
                 ref={mediaInputRef} 
                 onChange={handleMediaUpload} 
                 accept="image/*,video/*" 
                 className="hidden" 
               />
             </div>
           )}
        </div>

      </div>

      {/* Metadata Section (Shot Type & Camera Move) */}
      <div className="mt-2 flex gap-2">
          <select 
             value={shotType || ''} 
             onChange={(e) => onUpdate('shotType', e.target.value)}
             disabled={readOnly}
             className="flex-1 bg-slate-900/50 border border-gray-700 rounded text-xs text-gray-400 px-2 py-1 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
             <option value="" disabled>Shot Type</option>
             <option value="Wide Shot">Wide Shot</option>
             <option value="Medium Shot">Medium Shot</option>
             <option value="Close Up">Close Up</option>
             <option value="Extreme Close Up">Extreme Close Up</option>
          </select>

          <select 
             value={cameraMove || ''} 
             onChange={(e) => onUpdate('cameraMove', e.target.value)}
             disabled={readOnly}
             className="flex-1 bg-slate-900/50 border border-gray-700 rounded text-xs text-gray-400 px-2 py-1 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
          >
             <option value="" disabled>Camera Move</option>
             <option value="Static">Static</option>
             <option value="Pan Left">Pan Left</option>
             <option value="Pan Right">Pan Right</option>
             <option value="Tilt Up">Tilt Up</option>
             <option value="Tilt Down">Tilt Down</option>
             <option value="Zoom In">Zoom In</option>
             <option value="Dolly">Dolly</option>
          </select>
      </div>


      {/* Inputs for Script and Sound */}
      <div className="mt-2 space-y-3 px-1">
        
        {/* Script Input */}
        <div>
           <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
             Script
           </label>
           <textarea
             rows={2}
             value={script}
             readOnly={readOnly}
             onChange={(e) => onUpdate('script', e.target.value)}
             className="w-full bg-slate-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none disabled:opacity-70"
             placeholder={readOnly ? "No script provided." : "Action & Dialogue..."}
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
               readOnly={readOnly}
               onChange={(e) => onUpdate('sound', e.target.value)}
               className="flex-1 bg-slate-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-70"
               placeholder={readOnly ? "No sound description." : "SFX Description..."}
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
                   {!readOnly && (
                     <button 
                       onClick={() => onUpdate('audioUrl', '')}
                       className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/audio:opacity-100 transition-opacity scale-75 shadow-sm"
                       title="Remove Audio"
                     >
                       <Trash2 size={12} />
                     </button>
                   )}
                 </div>
               ) : (
                 !readOnly && (
                   <button 
                     onClick={() => audioInputRef.current?.click()}
                     className="h-full px-3 bg-slate-800 hover:bg-slate-700 text-gray-400 hover:text-indigo-400 rounded-lg border border-gray-700 transition-all"
                     title="Upload Audio"
                   >
                     <Music size={16} />
                   </button>
                 )
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
        {!readOnly && (
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
        )}

      </div>
    </div>
  );
};

export default MovieCard;
