
import React, { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import MovieCard from './MovieCard';
import { Plus, Save, Loader2, FileDown, Settings, X, MonitorPlay, ChevronLeft, ChevronRight, Layers, ZoomIn } from 'lucide-react';
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
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DropAnimation,
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
  id: string | number;
  script: string;
  sound: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  drawingData?: any;
  shotType?: string;
  cameraMove?: string;
}

interface SequenceData {
  id: string;
  title: string;
  frames: FrameData[];
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

  // Sequences State (New Data Structure)
  const [sequences, setSequences] = useState<SequenceData[]>([
    {
      id: 'seq_1',
      title: 'Scene 1',
      frames: [
        { id: 'frame_1', script: '', sound: '' },
        { id: 'frame_2', script: '', sound: '' },
        { id: 'frame_3', script: '', sound: '' }
      ]
    }
  ]);
  
  // Drag State
  const [activeId, setActiveId] = useState<string | number | null>(null);

  // Presentation State
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { saveProject, loadProject, isSaving, isLoading } = useFirestore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Flatten sequences for presentation and PDF export
  const allFrames = useMemo(() => {
    return sequences.flatMap(seq => seq.frames);
  }, [sequences]);

  // Load project
  useEffect(() => {
    const initProject = async () => {
      if (user && projectId) {
        try {
          const loadedData = await loadProject(projectId);
          if (loadedData) {
            setSequences(loadedData.sequences);
            setProjectTitle(loadedData.projectTitle || "Untitled Storyboard");
            setAspectRatio(loadedData.aspectRatio || "16:9");
          }
        } catch (error) {
          console.error("Initialization error:", error);
        }
      }
    };
    initProject();
  }, [user, projectId, loadProject]);

  // Handle Keyboard for Presentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresenting) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') setIsPresenting(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, currentSlideIndex, allFrames.length]);

  // --- Actions ---

  const handleAddScene = () => {
    setSequences(prev => [
      ...prev,
      {
        id: `seq_${Date.now()}`,
        title: `Scene ${prev.length + 1}`,
        frames: []
      }
    ]);
  };

  const handleAddFrame = (sequenceId: string) => {
    setSequences(prev => prev.map(seq => {
      if (seq.id !== sequenceId) return seq;
      return {
        ...seq,
        frames: [
          ...seq.frames,
          {
            id: `frame_${Date.now()}`,
            script: '',
            sound: ''
          }
        ]
      };
    }));
  };

  const handleDeleteFrame = (frameId: string | number) => {
    if (window.confirm('Are you sure you want to delete this frame?')) {
      setSequences(prev => prev.map(seq => ({
        ...seq,
        frames: seq.frames.filter(f => f.id !== frameId)
      })));

      // Safety check for presentation mode
      if (isPresenting) {
        if (allFrames.length <= 1) setIsPresenting(false);
        else if (currentSlideIndex >= allFrames.length - 1) setCurrentSlideIndex(Math.max(0, allFrames.length - 2));
      }
    }
  };

  const handleUpdateFrame = (frameId: string | number, field: keyof FrameData, value: any) => {
    setSequences(prev => prev.map(seq => ({
      ...seq,
      frames: seq.frames.map(f => f.id === frameId ? { ...f, [field]: value } : f)
    })));
  };

  const handleUpdateSceneTitle = (sequenceId: string, newTitle: string) => {
    setSequences(prev => prev.map(seq => 
      seq.id === sequenceId ? { ...seq, title: newTitle } : seq
    ));
  };

  const handleSave = async () => {
    if (user && projectId) {
      const projectData = {
        sequences,
        projectTitle: projectTitle,
        aspectRatio
      };
      await saveProject(projectId, projectData, user.uid);
    }
  };

  // --- Drag & Drop Logic ---

  const findContainer = (id: string | number) => {
    if (sequences.find(seq => seq.id === id)) return id;
    return sequences.find(seq => seq.frames.find(f => f.id === id))?.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(overId);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Moving items between containers
    setSequences((prev) => {
      const activeSeqIndex = prev.findIndex(s => s.id === activeContainer);
      const overSeqIndex = prev.findIndex(s => s.id === overContainer);
      
      if (activeSeqIndex === -1 || overSeqIndex === -1) return prev;

      const activeItems = [...prev[activeSeqIndex].frames];
      const overItems = [...prev[overSeqIndex].frames];
      
      const activeIndex = activeItems.findIndex(f => f.id === active.id);
      const overIndex = overItems.findIndex(f => f.id === overId);

      let newIndex;
      if (overIndex === -1) {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      const [movedItem] = activeItems.splice(activeIndex, 1);
      overItems.splice(newIndex, 0, movedItem);

      const newSequences = [...prev];
      newSequences[activeSeqIndex] = { ...newSequences[activeSeqIndex], frames: activeItems };
      newSequences[overSeqIndex] = { ...newSequences[overSeqIndex], frames: overItems };

      return newSequences;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over?.id || '');

    if (
      activeContainer &&
      overContainer &&
      activeContainer === overContainer
    ) {
      const activeIndex = sequences.find(s => s.id === activeContainer)?.frames.findIndex(f => f.id === active.id);
      const overIndex = sequences.find(s => s.id === overContainer)?.frames.findIndex(f => f.id === over?.id);

      if (activeIndex !== undefined && overIndex !== undefined && activeIndex !== overIndex) {
        setSequences((prev) => prev.map(seq => {
          if (seq.id === activeContainer) {
            return {
              ...seq,
              frames: arrayMove(seq.frames, activeIndex, overIndex)
            };
          }
          return seq;
        }));
      }
    }

    setActiveId(null);
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: {
        active: {
          opacity: '0.5',
        },
      },
    }),
  };

  // --- Presentation ---
  const startPresentation = () => {
    if (allFrames.length === 0) return;
    setCurrentSlideIndex(0);
    setIsPresenting(true);
  };
  const nextSlide = () => setCurrentSlideIndex(p => (p < allFrames.length - 1 ? p + 1 : p));
  const prevSlide = () => setCurrentSlideIndex(p => (p > 0 ? p - 1 : p));

  // --- PDF Export ---
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const itemsPerPage = 12;
      const totalPages = Math.ceil(allFrames.length / itemsPerPage);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) doc.addPage();
        const startIdx = i * itemsPerPage;
        const pageFrames = allFrames.slice(startIdx, startIdx + itemsPerPage);

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

        // Add Header
        const headerEl = document.createElement('div');
        headerEl.style.gridColumn = '1 / -1';
        headerEl.style.marginBottom = '20px';
        headerEl.style.color = '#0f172a';
        headerEl.style.borderBottom = '2px solid #e2e8f0';
        headerEl.style.paddingBottom = '10px';
        headerEl.innerHTML = `<h1 style="margin:0; font-size: 24px;">${projectTitle}</h1><p style="margin:5px 0 0; color:#64748b; font-size:12px;">Generated via Storybored</p>`;
        tempContainer.appendChild(headerEl);

        for (let idx = 0; idx < pageFrames.length; idx++) {
          const frame = pageFrames[idx];
          const frameEl = document.createElement('div');
          frameEl.style.display = 'flex';
          frameEl.style.flexDirection = 'column';
          frameEl.style.border = '1px solid #e2e8f0';
          frameEl.style.borderRadius = '8px';
          frameEl.style.overflow = 'hidden';

          const screenDiv = document.createElement('div');
          let ar = aspectRatio === '4:3' ? '4/3' : aspectRatio === '1:1' ? '1/1' : aspectRatio === '9:16' ? '9/16' : '16/9';
          screenDiv.style.aspectRatio = ar;
          screenDiv.style.backgroundColor = '#1e293b'; 
          screenDiv.style.display = 'flex';
          screenDiv.style.alignItems = 'center';
          screenDiv.style.justifyContent = 'center';
          screenDiv.style.color = '#94a3b8';
          screenDiv.style.position = 'relative';
          
          if (frame.imageUrl) {
            screenDiv.innerHTML = `<img src="${frame.imageUrl}" style="width:100%; height:100%; object-fit:cover;" />`;
          } else {
             screenDiv.innerHTML = `<span style="font-weight: bold; font-size: 1.5rem;"># ${startIdx + idx + 1}</span>`;
          }
          
          const contentDiv = document.createElement('div');
          contentDiv.style.padding = '12px';
          contentDiv.style.flex = '1';
          contentDiv.style.backgroundColor = '#f8fafc';

          const scriptP = document.createElement('div');
          scriptP.innerHTML = `<strong style="display:block; font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:2px;">Script</strong> <span style="font-size:12px; color:#334155;">${frame.script || '—'}</span>`;
          const soundP = document.createElement('div');
          soundP.style.marginTop = '8px';
          soundP.innerHTML = `<strong style="display:block; font-size:10px; color:#64748b; text-transform:uppercase; margin-bottom:2px;">Sound</strong> <span style="font-size:12px; color:#334155;">${frame.sound || '—'}</span>`;
          
          const metaDiv = document.createElement('div');
          metaDiv.style.marginTop = '8px';
          metaDiv.style.display = 'flex';
          metaDiv.style.gap = '10px';
          metaDiv.innerHTML = `
            <div><strong style="display:block; font-size:9px; color:#94a3b8; text-transform:uppercase;">Shot</strong> <span style="font-size:10px; color:#475569;">${frame.shotType || '-'}</span></div>
            <div><strong style="display:block; font-size:9px; color:#94a3b8; text-transform:uppercase;">Cam</strong> <span style="font-size:10px; color:#475569;">${frame.cameraMove || '-'}</span></div>
          `;

          contentDiv.appendChild(scriptP);
          contentDiv.appendChild(soundP);
          contentDiv.appendChild(metaDiv);

          frameEl.appendChild(screenDiv);
          frameEl.appendChild(contentDiv);
          tempContainer.appendChild(frameEl);
        }

        document.body.appendChild(tempContainer);
        const canvas = await html2canvas(tempContainer, { scale: 2, useCORS: true });
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

  // Calculate running indices for global frame numbering
  let globalFrameCount = 0;

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
          <div className="space-y-3">
            <label htmlFor="project-title" className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Project Title</label>
            <input 
              id="project-title"
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

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
                    style={{ width: '24px', aspectRatio: ratio.replace(':', '/') }} 
                  />
                  <span className="text-xs font-medium">{ratio}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Project Stats</h3>
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-gray-400">Total Frames</span>
              <span className="font-mono text-white">{allFrames.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Total Scenes</span>
              <span className="font-mono text-white">{sequences.length}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-600">
          v1.2.0 &bull; Multimedia Support
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
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{projectTitle}</h1>
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
                </div>
            </div>

            {/* Drag & Drop Context */}
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-12">
                {sequences.map((sequence) => {
                  const currentGlobalIndex = globalFrameCount;
                  globalFrameCount += sequence.frames.length;
                  
                  return (
                    <div key={sequence.id} className="space-y-4">
                      {/* Sequence Header */}
                      <div className="flex items-center gap-3 border-b border-gray-800 pb-2">
                        <Layers className="w-5 h-5 text-indigo-500" />
                        <input
                          type="text"
                          aria-label={`Title for ${sequence.title}`}
                          value={sequence.title}
                          onChange={(e) => handleUpdateSceneTitle(sequence.id, e.target.value)}
                          className="bg-transparent text-xl font-bold text-slate-200 focus:outline-none focus:text-white placeholder-gray-600"
                          placeholder="Scene Name"
                        />
                      </div>

                      {/* Sortable Area for this Sequence */}
                      <SortableContext 
                        id={sequence.id}
                        items={sequence.frames.map(f => f.id)} 
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 min-h-[100px] p-2 rounded-xl transition-colors">
                          {sequence.frames.map((frame, index) => (
                            <MovieCard 
                              key={frame.id}
                              id={frame.id}
                              index={currentGlobalIndex + index} 
                              script={frame.script}
                              sound={frame.sound}
                              imageUrl={frame.imageUrl}
                              videoUrl={frame.videoUrl}
                              audioUrl={frame.audioUrl}
                              aspectRatio={aspectRatio}
                              drawingData={frame.drawingData}
                              shotType={frame.shotType}
                              cameraMove={frame.cameraMove}
                              onUpdate={(field, value) => handleUpdateFrame(frame.id, field as keyof FrameData, value)}
                              onDelete={() => handleDeleteFrame(frame.id)}
                            />
                          ))}
                          {/* Empty Drop Zone Hint if empty */}
                          {sequence.frames.length === 0 && (
                            <div className="col-span-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-xl bg-slate-900/30 text-gray-500 text-sm">
                              Drag frames here
                            </div>
                          )}
                        </div>
                      </SortableContext>

                      {/* Add Frame to this Scene */}
                      <button 
                         onClick={() => handleAddFrame(sequence.id)}
                         className="flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/20 rounded-lg transition-colors"
                      >
                         <Plus size={16} /> Add Frame to {sequence.title}
                      </button>
                    </div>
                  );
                })}
              </div>
              
              <DragOverlay dropAnimation={dropAnimation}>
                {activeId ? (
                   <div className="w-[300px] opacity-80">
                      {/* Placeholder for dragging - simplified view */}
                      <div className="bg-slate-800 rounded-xl p-4 border border-indigo-500 shadow-2xl">
                        <div className="aspect-video bg-black/50 rounded-lg mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      </div>
                   </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {/* Add New Scene Button */}
            <div className="mt-16 pb-10 border-t border-gray-800 pt-8 flex justify-center">
              <button 
                onClick={handleAddScene}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 border border-gray-700 hover:border-gray-500 hover:bg-slate-800 text-white rounded-xl transition-all shadow-lg active:scale-95"
              >
                <Layers className="w-5 h-5" />
                Add New Scene
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* PRESENTATION MODE MODAL */}
      {isPresenting && allFrames.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-900/50 backdrop-blur-sm border-b border-white/10 absolute top-0 w-full z-10">
            <h3 className="font-semibold text-lg">{projectTitle}</h3>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-400">Slide {currentSlideIndex + 1} / {allFrames.length}</span>
              <button onClick={() => setIsPresenting(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="absolute left-4 md:left-8 p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronLeft size={32} /></button>
            <button onClick={nextSlide} disabled={currentSlideIndex === allFrames.length - 1} className="absolute right-4 md:right-8 p-4 rounded-full bg-white/5 hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"><ChevronRight size={32} /></button>
            <div className="w-full max-w-5xl flex flex-col items-center gap-8">
               <div className="w-full bg-slate-800 rounded-2xl flex items-center justify-center shadow-2xl border border-white/10 relative overflow-hidden" style={{ aspectRatio: aspectRatio.replace(':', '/'), maxHeight: '60vh' }}>
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 backdrop-blur rounded text-sm font-mono text-white/70 z-10">Shot #{currentSlideIndex + 1}</div>
                  
                  {allFrames[currentSlideIndex].cameraMove === 'Zoom In' && (
                     <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 z-20">
                        <ZoomIn className="w-32 h-32 text-white" strokeWidth={1} />
                     </div>
                  )}

                  {allFrames[currentSlideIndex].videoUrl ? (
                    <video 
                      src={allFrames[currentSlideIndex].videoUrl} 
                      controls 
                      autoPlay 
                      className="w-full h-full object-contain"
                    />
                  ) : allFrames[currentSlideIndex].imageUrl ? (
                    <img 
                      src={allFrames[currentSlideIndex].imageUrl} 
                      className="w-full h-full object-contain" 
                      alt={`Shot ${currentSlideIndex + 1}`}
                    />
                  ) : (
                    <MonitorPlay className="w-24 h-24 text-slate-700 opacity-50" />
                  )}
               </div>
               <div className="w-full max-w-2xl text-center space-y-4">
                  <div className="flex justify-center gap-4 text-xs text-gray-400 font-mono">
                     {allFrames[currentSlideIndex].shotType && <span className="px-2 py-1 bg-white/5 rounded border border-white/10">{allFrames[currentSlideIndex].shotType}</span>}
                     {allFrames[currentSlideIndex].cameraMove && <span className="px-2 py-1 bg-white/5 rounded border border-white/10">{allFrames[currentSlideIndex].cameraMove}</span>}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Script / Action</h4>
                    <p className="text-xl md:text-2xl font-light text-white">{allFrames[currentSlideIndex].script || <span className="text-gray-600 italic">No script provided...</span>}</p>
                  </div>
                  {(allFrames[currentSlideIndex].sound || allFrames[currentSlideIndex].audioUrl) && (
                    <div className="pt-4 border-t border-white/10">
                      <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">Sound Cue</h4>
                      {allFrames[currentSlideIndex].sound && <p className="text-lg text-gray-300 mb-2">♫ {allFrames[currentSlideIndex].sound}</p>}
                      {allFrames[currentSlideIndex].audioUrl && (
                        <audio controls src={allFrames[currentSlideIndex].audioUrl} className="mx-auto mt-2 h-8" />
                      )}
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
