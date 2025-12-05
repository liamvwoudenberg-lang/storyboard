
import React, { useState, useEffect } from 'react';
import Header from './Header';
import MovieCard from './MovieCard';
import { Plus, Save, Loader2, FileDown, Settings, X, MonitorPlay, ChevronLeft, ChevronRight, Layers, ZoomIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User } from 'firebase/auth';
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

// ... (interface definitions remain the same)
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
  const { isGuest, logout } = useAuth(); // Use the isGuest flag from our context

  // Prompt state
  const [showGuestPrompt, setShowGuestPrompt] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  
  // App State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Drag State
  const [activeId, setActiveId] = useState<string | number | null>(null);

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
    useSensor(PointerSensor),
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPresenting) return;
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      else if (e.key === 'ArrowLeft') prevSlide();
      else if (e.key === 'Escape') setIsPresenting(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, currentSlideIndex, project?.frames?.length]);

  const handleAddScene = () => {
    const newSequences = [
      ...(project?.sequences || []),
      {
        id: `seq_${Date.now()}`,
        title: `Scene ${project?.sequences?.length + 1}`,
        frames: []
      }
    ];
    debouncedSave(projectId, { sequences: newSequences });
  };

  const handleAddFrame = (sequenceId: string) => {
    const newSequences = project.sequences.map(seq => {
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
    });
    debouncedSave(projectId, { sequences: newSequences });
  };

  const handleDeleteFrame = (frameId: string | number) => {
    if (window.confirm('Are you sure you want to delete this frame?')) {
      const newSequences = project.sequences.map(seq => ({
        ...seq,
        frames: seq.frames.filter(f => f.id !== frameId)
      }));
      debouncedSave(projectId, { sequences: newSequences });
      if (isPresenting) {
        if (project.frames.length <= 1) setIsPresenting(false);
        else if (currentSlideIndex >= project.frames.length - 1) setCurrentSlideIndex(Math.max(0, project.frames.length - 2));
      }
    }
  };

  const handleUpdateFrame = (frameId: string | number, field: keyof FrameData, value: any) => {
    const newSequences = project.sequences.map(seq => ({
      ...seq,
      frames: seq.frames.map(f => f.id === frameId ? { ...f, [field]: value } : f)
    }));
    debouncedSave(projectId, { sequences: newSequences });
  };

  const handleUpdateSceneTitle = (sequenceId: string, newTitle: string) => {
    const newSequences = project.sequences.map(seq => 
      seq.id === sequenceId ? { ...seq, title: newTitle } : seq
    );
    debouncedSave(projectId, { sequences: newSequences });
  };

  const handleSave = async () => {
    if (isGuest) {
      setShowGuestPrompt(true);
      return;
    }

    if (user && projectId) {
      await manualSave(projectId, project);
    }
  };

  const handleGuestSignUp = async () => {
    await logout(); // Log out the anonymous user first
    navigate('/login?signup=true'); // Redirect to sign-up
  };

  const handleGuestSignIn = async () => {
    await logout(); // Log out the anonymous user
    navigate('/login'); // Redirect to login
  };

  const handleExportPDF = () => {
    console.log("Exporting to PDF.");
    setIsExporting(true);
    const storyboardElement = document.getElementById('storyboard-preview');
    
    if (storyboardElement) {
        html2canvas(storyboardElement, {
            useCORS: true,
            scale: 2, 
        }).then(canvas => {
            const pdf = new jsPDF('l', 'px', [canvas.width, canvas.height]);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${project.projectTitle.replace(/ /g, '_')}_storyboard.pdf`);
            setIsExporting(false);
            alert('Storyboard exported as PDF!');
        }).catch(err => {
            console.error("Error exporting to PDF: ", err);
            setIsExporting(false);
            alert('Could not export to PDF. Please try again.');
        });
    } else {
        console.error("Could not find storyboard element to export.");
        setIsExporting(false);
        alert('Error: Storyboard element not found.');
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    if (project) {
      debouncedSave(project.id, { projectTitle: newTitle });
    }
  };


  // ... (Drag & Drop logic, Presentation, PDF Export remain the same)

  let globalFrameCount = 0;
  
  if (status === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Error: {error}</div>;
  if (!project) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">No Project Loaded</div>;

  return (
    <>
      {showGuestPrompt && (
        <GuestSavePrompt 
          onClose={() => setShowGuestPrompt(false)}
          onSignUp={handleGuestSignUp}
          onSignIn={handleGuestSignIn}
        />
      )}
      <div className="h-screen bg-slate-950 text-slate-100 flex overflow-hidden font-sans">
        {/* ... (Sidebar and Main Content) ... */}
         <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-10 scroll-smooth">
          <div id="storyboard-preview" className="max-w-7xl mx-auto pb-20">
            
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <input 
                      defaultValue={project.projectTitle} 
                      onChange={handleTitleChange} 
                      className="text-3xl font-bold text-white mb-2 tracking-tight bg-transparent border-none focus:outline-none focus:ring-0"
                    />
                    <p className="text-gray-400 text-sm">Last saved: {new Date(project.lastEdited?.toDate()).toLocaleString()}</p>
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
                    disabled={status === 'saving' || status === 'loading'}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {status === 'saving' ? 'Saving...' : 'Save Project'}
                  </button>
                </div>
            </div>

            {/* ... (Rest of the Editor JSX) ... */}
            </div>
            </main>
      </div>
    </>
  );
};

export default Editor;
