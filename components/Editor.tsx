
import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import MovieCard from './MovieCard';
import { Plus, Save, Loader2, FileDown, Settings, ChevronLeft, ChevronRight, X, MonitorPlay } from 'lucide-react';
import { useFirestore } from '../hooks/useFirestore';
import { User } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface FrameData {
  id: number;
  script: string;
  sound: string;
}

interface EditorProps {
  user: User;
  onSignOut: () => void;
}

const Editor: React.FC<EditorProps> = ({ user, onSignOut }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  
  const [isExporting, setIsExporting] = useState(false);
  
  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projectTitle, setProjectTitle] = useState("Untitled Storyboard");
  const [aspectRatio, setAspectRatio] = useState("16:9");

  // Presentation State
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Initialize with default placeholder frames
  const [frames, setFrames] = useState<FrameData[]>(
    Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      script: '',
      sound: ''
    }))
  );

  const { saveProject, loadProject, isSaving, isLoading } = useFirestore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load project when component mounts or projectId changes
  useEffect(() => {
    const initProject = async () => {
      if (user && projectId) {
        try {
          // Use the URL param projectId to load specific project data
          const loadedFrames = await loadProject(projectId);
          if (loadedFrames && loadedFrames.length > 0) {
            setFrames(loadedFrames);
            // In a real app, we would also load the title and aspect ratio here
          } else {
            // New project or empty
             setFrames(Array.from({ length: 6 }, (_, i) => ({
              id: i + 1,
              script: '',
              sound: ''
            })));
          }
        } catch (error) {
          console.error("Initialization error:", error);
        }
      }
    };
    initProject();
  }, [user, projectId, loadProject]);

  // Handle Keyboard Navigation for Presentation Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresenting) return;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, currentSlideIndex, frames.length]);

  const handleAddFrame = () => {
    setFrames((prev) => [
      ...prev,
      {
        id: prev.length > 0 ? Math.max(...prev.map((f) => f.id)) + 1 : 1,
        script: '',
        sound: ''
      },
    ]);
  };

  const handleDeleteFrame = (id: number) => {
    if (window.confirm('Are you sure you want to delete this frame?')) {
      setFrames((prev) => prev.filter((f) => f.id !== id));
      
      // Safety check if we deleted the current slide being presented
      if (isPresenting) {
        if (frames.length <= 1) {
           setIsPresenting(false);
        } else if (currentSlideIndex >= frames.length - 1) {
           setCurrentSlideIndex(Math.max(0, frames.length - 2));
        }
      }
    }
  };

  const handleUpdateFrame = (id: number, field: 'script' | 'sound', value: string) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === id ? { ...frame, [field]: value } : frame
      )
    );
  };

  const handleSave = async () => {
    if (user && projectId) {
      await saveProject(projectId, frames);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFrames((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Presentation Logic
  const startPresentation = () => {
    if (frames.length === 0) return;
    setCurrentSlideIndex(0);
    setIsPresenting(true);
  };

  const nextSlide = () => {
    setCurrentSlideIndex(prev => (prev < frames.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const itemsPerPage = 12;
      const totalPages = Math.ceil(frames.length / itemsPerPage);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) doc.addPage();

        const startIdx = i * itemsPerPage;
        const pageFrames = frames.slice(startIdx, startIdx + itemsPerPage);

        const tempContainer = document.createElement('div');
        tempContainer.style.width = '1200px'; 
        tempContainer.style.backgroundColor = '#ffffff'; 
        tempContainer.style.padding = '40px';
        tempContainer.style.display = 'grid';
        tempContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
        tempContainer.style.gap = '20px';
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.fontFamily = 'sans-serif';

        // Add Header to PDF
        const headerEl = document.createElement('div');
        headerEl.style.gridColumn = '1 / -1';
        headerEl.style.marginBottom = '20px';
        headerEl.style.color = '#0f172a';
        headerEl.style.borderBottom = '2px solid #e2e8f0';
        headerEl.style.paddingBottom = '10px';
        headerEl.innerHTML = `<h1 style="margin:0; font-size: 24px;">${projectTitle}</h1><p style="margin:5px 0 0; color:#64748b; font-size:12px;">Generated via CinemaGrid</p>`;
        tempContainer.appendChild(headerEl);

        pageFrames.forEach((frame, idx) => {
          const frameEl = document.createElement('div');
          frameEl.style.display = 'flex';
          frameEl.style.flexDirection = 'column';
          frameEl.style.breakInside = 'avoid';
          frameEl.style.border = '1px solid #e2e8f0';
          frameEl.style.borderRadius = '8px';
          frameEl.style.overflow = 'hidden';

          const screenDiv = document.createElement('div');
          // Use current aspect ratio setting for export
          let ar = '16/9';
          if(aspectRatio === '4:3') ar = '4/3';
          if(aspectRatio === '1:1') ar = '1/1';
          if(aspectRatio === '9:16') ar = '9/16';

          screenDiv.style.aspectRatio = ar;
          screenDiv.style.backgroundColor = '#1e293b'; 
          screenDiv.style.display = 'flex';
          screenDiv.style.alignItems = 'center';
          screenDiv.style.justifyContent = 'center';
          screenDiv.style.color = '#94a3b8';
          screenDiv.innerHTML = `<span style="font-weight: bold; font-size: 1.5rem;"># ${startIdx + idx + 1}</span>`;
          
          const contentDiv = document.createElement('div');
          contentDiv.style.padding = '12px';
          contentDiv.style.flex = '1';
          contentDiv.style.backgroundColor = '#f8fafc';

          const scriptP = document.createElement('div');
          scriptP.style.fontSize = '12px';
          scriptP.style.marginBottom = '8px';
          scriptP.style.color = '#334155';
          scriptP.innerHTML = `<strong style="display:block; font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:2px;">Script</strong> ${frame.script || '—'}`;

          const soundP = document.createElement('div');
          soundP.style.fontSize = '12px';
          soundP.style.color = '#334155';
          soundP.innerHTML = `<strong style="display:block; font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:2px;">Sound</strong> ${frame.sound || '—'}`;

          contentDiv.appendChild(scriptP);
          contentDiv.appendChild(soundP);
          frameEl.appendChild(screenDiv);
          frameEl.appendChild(contentDiv);
          tempContainer.appendChild(frameEl);
        });

        document.body.appendChild(tempContainer);

        const canvas = await html2canvas(tempContainer, {
          scale: 2, 
          useCORS: true
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const imgProps = doc.getImageProperties(imgData);
        const pdfImgHeight = (imgProps.height * pageWidth) / imgProps.width;

        doc.addImage(imgData, 'JPEG', 0, 0, pageWidth, Math.min(pdfImgHeight, pageHeight));
        document.body.removeChild(tempContainer);
      }

      doc.save(`${projectTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`);

    } catch (err) {
      console.error("PDF Export failed", err);
      alert("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <aside 
        className={`${
          isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full'
        } fixed inset-y-0 left-0 z-30 bg-slate-900 border-r border-gray-800 transition-all duration-300 ease-in-out flex flex-col overflow-hidden sm:relative sm:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-800 flex items-center gap-3">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h2 className="font-semibold text-lg">Project Settings</h2>
        </div>
        
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          {/* Project Title Input */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Title</label>
            <input 
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Aspect Ratio Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Aspect Ratio</label>
            <div className="grid grid-cols-2 gap-3">
              {['16:9', '4:3', '1:1', '9:16'].map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    aspectRatio === ratio 
                      ? 'bg-indigo-600/10 border-indigo-500 text-indigo-400' 
                      : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-gray-600 hover:bg-slate-800'
                  }`}
                >
                  <div className={`border-2 rounded-sm mb-2 ${aspectRatio === ratio ? 'border-indigo-400' : 'border-gray-500'}`} 
                    style={{ 
                      width: '24px', 
                      aspectRatio: ratio.replace(':', '/') 
                    }} 
                  />
                  <span className="text-xs font-medium">{ratio}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Stats</h3>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Total Frames</span>
              <span className="font-mono text-white">{frames.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Est. Duration</span>
              <span className="font-mono text-white">~{frames.length * 5}s</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-600">
          v1.0.2 &bull; Enterprise Plan
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        <Header 
          user={user} 
          onSignOut={onSignOut} 
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onPresent={startPresentation}
          onBackToDashboard={() => navigate('/')}
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-10 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-20">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{projectTitle}</h2>
                    <p className="text-gray-400 text-sm">Last saved: {new Date().toLocaleTimeString()}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    PDF
                  </button>

                  <button 
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 rounded-lg transition-all text-sm font-medium disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>

                  <button 
                    onClick={handleAddFrame}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    New Frame
                  </button>
                </div>
            </div>

            {/* Grid */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={frames.map(f => f.id)} 
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                  {frames.map((frame, index) => (
                    <MovieCard 
                      key={frame.id}
                      id={frame.id}
                      index={index} 
                      script={frame.script}
                      sound={frame.sound}
                      aspectRatio={aspectRatio}
                      onUpdate={(field, value) => handleUpdateFrame(frame.id, field, value)}
                      onDelete={() => handleDeleteFrame(frame.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            
            {/* Empty State Helper */}
            {frames.length === 0 && (
               <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl">
                 <p className="text-gray-500 mb-4">No frames yet.</p>
                 <button 
                    onClick={handleAddFrame}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
                 >
                    <Plus className="w-4 h-4" /> Create First Frame
                 </button>
               </div>
            )}
          </div>
        </main>
      </div>

      {/* PRESENTATION MODE MODAL */}
      {isPresenting && frames.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
          {/* Presentation Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/10 absolute top-0 w-full z-10">
            <h3 className="font-semibold text-lg">{projectTitle}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">
                Slide {currentSlideIndex + 1} / {frames.length}
              </span>
              <button 
                onClick={() => setIsPresenting(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Slide Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            
            {/* Previous Arrow */}
            <button 
              onClick={prevSlide}
              disabled={currentSlideIndex === 0}
              className="absolute left-4 md:left-8 p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={32} />
            </button>

            {/* Next Arrow */}
            <button 
              onClick={nextSlide}
              disabled={currentSlideIndex === frames.length - 1}
              className="absolute right-4 md:right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={32} />
            </button>

            {/* Screen Placeholder */}
            <div className="w-full max-w-5xl flex flex-col items-center gap-8">
               <div 
                 className="w-full bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden"
                 style={{ 
                   aspectRatio: aspectRatio.replace(':', '/'), 
                   maxHeight: '60vh'
                 }}
               >
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur rounded text-sm font-mono text-white/70">
                    Shot #{currentSlideIndex + 1}
                  </div>
                  <MonitorPlay className="w-24 h-24 text-slate-700 opacity-50" />
               </div>

               {/* Script Content */}
               <div className="w-full max-w-2xl text-center space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Script / Action</h4>
                    <p className="text-xl md:text-2xl font-light text-white">
                      {frames[currentSlideIndex].script || <span className="text-gray-600 italic">No script provided...</span>}
                    </p>
                  </div>
                  {frames[currentSlideIndex].sound && (
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Sound Cue</h4>
                      <p className="text-lg text-gray-300">
                         ♫ {frames[currentSlideIndex].sound}
                      </p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Editor;
