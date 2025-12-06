
import React, { useState, useEffect } from 'react';
import Header from './Header';
import MovieCard from './MovieCard';
import Sidebar from './Sidebar';
import { Plus, Save, Loader2, FileDown, Settings, X, MonitorPlay, ChevronLeft, ChevronRight, Layers, ZoomIn, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from 'firebase/auth';
import { useParams, useNavigate } from 'react-router-dom';
import GuestSavePrompt from './GuestSavePrompt';
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
import { useStoryboardEditor } from '../hooks/useStoryboardEditor';
import ShareModal from './ShareModal';

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

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const Editor: React.FC<EditorProps> = ({ user, onSignOut }) => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { isGuest, logout } = useAuth();

  // Prompt state
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  
  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Drag State
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [activeFrame, setActiveFrame] = useState<FrameData | null>(null);

  // Presentation State
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const { 
    currentDoc: project, 
    status, 
    error, 
    subscribeToStoryboard, 
    debouncedSave, 
    manualSave 
  } = useStoryboardEditor();

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (projectId) {
      const unsubscribe = subscribeToStoryboard(projectId);
      return () => unsubscribe();
    }
  }, [projectId, subscribeToStoryboard]);

  // Handle sequences safely (fallback to empty array)
  const sequences: SequenceData[] = project?.sequences || [];
  
  // Create a flat list of all frames for presentation mode
  const allFrames = sequences.flatMap(s => s.frames);

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

  const handleUpdateProject = (data: any) => {
    if (project) {
      debouncedSave(project.id, data);
    }
  };

  const handleAddScene = () => {
    if (!project) return;
    const newSequences = [
      ...sequences,
      {
        id: `seq_${Date.now()}`,
        title: `Scene ${sequences.length + 1}`,
        frames: []
      }
    ];
    handleUpdateProject({ sequences: newSequences });
  };

  const handleDeleteScene = (sequenceId: string) => {
    if (!project) return;
    if (window.confirm('Are you sure you want to delete this entire scene?')) {
        const newSequences = sequences.filter(s => s.id !== sequenceId);
        handleUpdateProject({ sequences: newSequences });
    }
  };

  const handleAddFrame = (sequenceId: string) => {
    if (!project) return;
    const newSequences = sequences.map(seq => {
      if (seq.id !== sequenceId) return seq;
      return {
        ...seq,
        frames: [
          ...seq.frames,
          {
            id: `frame_${Date.now()}`,
            script: '',
            sound: '',
            shotType: '',
            cameraMove: ''
          }
        ]
      };
    });
    handleUpdateProject({ sequences: newSequences });
  };

  const handleDeleteFrame = (frameId: string | number) => {
    if (!project) return;
    if (window.confirm('Are you sure you want to delete this frame?')) {
      const newSequences = sequences.map(seq => ({
        ...seq,
        frames: seq.frames.filter(f => f.id !== frameId)
      }));
      handleUpdateProject({ sequences: newSequences });
      
      // Adjust presentation if needed
      if (isPresenting) {
        if (allFrames.length <= 1) setIsPresenting(false);
        else if (currentSlideIndex >= allFrames.length - 1) setCurrentSlideIndex(Math.max(0, allFrames.length - 2));
      }
    }
  };

  const handleUpdateFrame = (frameId: string | number, field: keyof FrameData, value: any) => {
    if (!project) return;
    const newSequences = sequences.map(seq => ({
      ...seq,
      frames: seq.frames.map(f => f.id === frameId ? { ...f, [field]: value } : f)
    }));
    handleUpdateProject({ sequences: newSequences });
  };

  const handleUpdateSceneTitle = (sequenceId: string, newTitle: string) => {
    if (!project) return;
    const newSequences = sequences.map(seq => 
      seq.id === sequenceId ? { ...seq, title: newTitle } : seq
    );
    handleUpdateProject({ sequences: newSequences });
  };

  const handleSave = async () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }

    if (user && project) {
      await manualSave(project.id, project);
    }
  };

  const handleGuestSignUp = async () => {
    await logout();
    navigate('/login?signup=true');
  };

  const handleGuestSignIn = async () => {
    await logout();
    navigate('/login');
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
        const storyboardElement = document.getElementById('storyboard-preview');
        
        if (storyboardElement) {
            html2canvas(storyboardElement, { useCORS: true, scale: 1.5, backgroundColor: '#0f172a' }).then(canvas => {
                const orientation = canvas.width > canvas.height ? 'l' : 'p';
                const pdf = new jsPDF(orientation, 'px', [canvas.width, canvas.height]);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`${project.projectTitle.replace(/ /g, '_')}_storyboard.pdf`);
                setIsExporting(false);
            }).catch(err => {
                console.error("Error exporting to PDF: ", err);
                setIsExporting(false);
                alert('Could not export to PDF. Check console.');
            });
        } else {
            console.error("Could not find storyboard element.");
            setIsExporting(false);
        }
    }, 100);
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleUpdateProject({ projectTitle: e.target.value });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sequences.flatMap(s => s.frames).findIndex(f => f.id === active.id);
    const newIndex = sequences.flatMap(s => s.frames).findIndex(f => f.id === over.id);
    
    const flatFrames = sequences.flatMap(s => s.frames);
    const movedFrames = arrayMove(flatFrames, oldIndex, newIndex);

    // This is a simplified re-grouping. A more complex logic might be needed 
    // if you want to move frames between sequences through drag and drop.
    let frameIdx = 0;
    const newSequences = sequences.map(seq => {
        const newFrames = movedFrames.slice(frameIdx, frameIdx + seq.frames.length);
        frameIdx += seq.frames.length;
        return { ...seq, frames: newFrames };
    });

    handleUpdateProject({ sequences: newSequences });
    setActiveId(null);
    setActiveFrame(null);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
    const frame = sequences.flatMap(s => s.frames).find(f => f.id === event.active.id);
    if (frame) setActiveFrame(frame);
  };
  
  const handleScrollToScene = (sequenceId: string) => {
     // A simple implementation to scroll to the scene
     // You might want to add ids to your scene divs for this to work
     // For now, this is a placeholder
     console.log("Scroll to scene:", sequenceId);
     // If you add id={sequence.id} to the scene div, you can do:
     // document.getElementById(sequence.id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const nextSlide = () => setCurrentSlideIndex(prev => Math.min(prev + 1, allFrames.length - 1));
  const prevSlide = () => setCurrentSlideIndex(prev => Math.max(prev - 1, 0));

  if (status === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Error: {error}</div>;
  if (!project) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">No Project Loaded</div>;

  let globalFrameCount = 0;

  return (
    <>
      {showGuestPrompt && (
        <GuestSavePrompt onClose={() => setShowGuestPrompt(false)} onSignUp={handleGuestSignUp} onSignIn={handleGuestSignIn} />
      )}
      
      {showShareModal && (
        <ShareModal
            projectTitle={project.projectTitle}
            projectId={project.id}
            ownerEmail={user.email || ""}
            ownerName={user.displayName || ""}
            ownerPhotoURL={user.photoURL || ""}
            onClose={() => setShowShareModal(false)}
            project={project} // Pass the full project document
            onUpdate={handleUpdateProject} // Pass the update function
        />
      )}

      {isPresenting && allFrames.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
           <button onClick={() => setIsPresenting(false)} className="absolute top-4 right-4 text-white/50 hover:text-white p-2"><X size={32} /></button>
           <div className="w-full max-w-6xl aspect-video bg-black flex items-center justify-center relative">
              {allFrames[currentSlideIndex]?.imageUrl ? (
                  <img src={allFrames[currentSlideIndex].imageUrl} className="max-w-full max-h-full object-contain" alt="" />
              ) : allFrames[currentSlideIndex]?.videoUrl ? (
                  <video src={allFrames[currentSlideIndex].videoUrl} controls autoPlay className="max-w-full max-h-full" />
              ) : (
                  <div className="text-gray-500 flex flex-col items-center"><Layers size={64} className="mb-4 opacity-50"/><span className="text-xl">Empty Frame</span></div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent">
                 <p className="text-white text-xl font-medium mb-2">{allFrames[currentSlideIndex]?.script}</p>
                 {allFrames[currentSlideIndex]?.sound && <p className="text-gray-400 text-sm flex items-center gap-2">🎵 {allFrames[currentSlideIndex].sound}</p>}
              </div>
           </div>
           <div className="absolute bottom-8 flex gap-4 items-center">
              <button onClick={prevSlide} disabled={currentSlideIndex === 0} className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"><ChevronLeft size={24} /></button>
              <span className="text-white/50 font-mono">{currentSlideIndex + 1} / {allFrames.length}</span>
              <button onClick={nextSlide} disabled={currentSlideIndex === allFrames.length - 1} className="p-3 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all"><ChevronRight size={24} /></button>
           </div>
        </div>
      )}

      <div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
         <Header user={user} onSignOut={onSignOut} isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onBackToDashboard={() => navigate('/')} onPresent={() => setIsPresenting(true)} onShare={() => setShowShareModal(true)} />
         
         <div className="flex flex-1 overflow-hidden">
             <Sidebar isOpen={isSidebarOpen} sequences={sequences} onSelectScene={handleScrollToScene} />
             
             <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-10 scroll-smooth">
              <div id="storyboard-preview" className="max-w-7xl mx-auto pb-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <input value={project.projectTitle} onChange={handleTitleChange} className="text-3xl font-bold text-white mb-2 tracking-tight bg-transparent border-none focus:outline-none focus:ring-0 w-full placeholder-gray-600" placeholder="Untitled Project"/>
                        <p className="text-gray-400 text-sm">Last saved: {project.lastEdited?.toDate ? new Date(project.lastEdited.toDate()).toLocaleString() : 'Unsaved'}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 border border-slate-700 rounded-lg transition-all text-sm font-medium disabled:opacity-50">
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                        PDF
                      </button>
                      <button onClick={handleSave} disabled={status === 'saving' || status === 'loading'} className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                        {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {status === 'saving' ? 'Saving...' : 'Save Project'}
                      </button>
                    </div>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <div className="space-y-12">
                        {sequences.map((sequence, seqIndex) => {
                            const currentGlobalIndex = globalFrameCount;
                            globalFrameCount += sequence.frames.length;

                            return (
                                <div key={sequence.id} id={sequence.id} className="group/scene">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-800 pb-2">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-gray-400">{seqIndex + 1}</div>
                                            <input value={sequence.title} onChange={(e) => handleUpdateSceneTitle(sequence.id, e.target.value)} className="text-xl font-bold text-slate-200 bg-transparent border-none focus:outline-none focus:ring-0 flex-1 placeholder-gray-600" placeholder="Scene Title" />
                                        </div>
                                        <button onClick={() => handleDeleteScene(sequence.id)} className="text-gray-500 hover:text-red-400 p-2 rounded hover:bg-slate-800 opacity-0 group-hover/scene:opacity-100 transition-opacity" title="Delete Scene"><Trash2 size={18} /></button>
                                    </div>

                                    <SortableContext items={sequence.frames.map(f => f.id)} strategy={rectSortingStrategy}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                                                    aspectRatio={project.aspectRatio}
                                                    shotType={frame.shotType}
                                                    cameraMove={frame.cameraMove}
                                                    drawingData={frame.drawingData}
                                                    onUpdate={(field, val) => handleUpdateFrame(frame.id, field, val)}
                                                    onDelete={() => handleDeleteFrame(frame.id)}
                                                />
                                            ))}
                                            <button onClick={() => handleAddFrame(sequence.id)} className="flex flex-col items-center justify-center h-full min-h-[300px] rounded-xl border-2 border-dashed border-gray-800 bg-slate-900/30 hover:bg-slate-900 hover:border-indigo-500/50 transition-all duration-300 group/add">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 group-hover/add:bg-indigo-600/20 group-hover/add:text-indigo-400 flex items-center justify-center mb-4 transition-colors"><Plus className="w-6 h-6 text-gray-400 group-hover/add:text-indigo-400" /></div>
                                                <span className="font-medium text-gray-400 group-hover/add:text-indigo-300">Add Frame</span>
                                            </button>
                                        </div>
                                    </SortableContext>
                                </div>
                            );
                        })}
                    </div>

                    <DragOverlay dropAnimation={dropAnimation}>
                        {activeId && activeFrame ? (
                            <div className="opacity-80 rotate-2 scale-105 cursor-grabbing">
                                 <MovieCard 
                                    id={activeFrame.id}
                                    index={0} // Index doesn't matter for overlay
                                    script={activeFrame.script}
                                    sound={activeFrame.sound}
                                    imageUrl={activeFrame.imageUrl}
                                    videoUrl={activeFrame.videoUrl}
                                    audioUrl={activeFrame.audioUrl}
                                    aspectRatio={project.aspectRatio}
                                    shotType={activeFrame.shotType}
                                    cameraMove={activeFrame.cameraMove}
                                    drawingData={activeFrame.drawingData}
                                    onUpdate={() => {}}
                                    onDelete={() => {}}
                                    readOnly={true}
                                />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                <div className="mt-16 flex justify-center border-t border-gray-800 pt-10">
                    <button onClick={handleAddScene} className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-semibold transition-all shadow-lg hover:shadow-xl border border-slate-700">
                        <Plus size={20} />
                        Add New Scene
                    </button>
                </div>

              </div>
             </main>
         </div>
      </div>
    </>
  );
};

export default Editor;
