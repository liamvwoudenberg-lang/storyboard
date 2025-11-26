import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MovieCard from './components/MovieCard';
import { Plus, Save, Loader2, DownloadCloud } from 'lucide-react';
import { useFirestore } from './hooks/useFirestore';
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

interface FrameData {
  id: number;
  script: string;
  sound: string;
}

const PROJECT_ID = 'demo-storyboard'; // In a real app, this might come from the URL or user selection

const App: React.FC = () => {
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

  // Load project on mount
  useEffect(() => {
    const fetchFrames = async () => {
      const loadedFrames = await loadProject(PROJECT_ID);
      if (loadedFrames && loadedFrames.length > 0) {
        setFrames(loadedFrames);
      }
    };
    fetchFrames();
  }, [loadProject]);

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

  const handleUpdateFrame = (id: number, field: 'script' | 'sound', value: string) => {
    setFrames((prev) =>
      prev.map((frame) =>
        frame.id === id ? { ...frame, [field]: value } : frame
      )
    );
  };

  const handleSave = async () => {
    await saveProject(PROJECT_ID, frames);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-white">Storyboard Sequences</h2>
                  {isLoading && <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />}
                </div>
                <p className="text-gray-400">Draft your visual narrative by adding scripts and sound cues.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleSave}
                disabled={isSaving || isLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-slate-700 rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Project'}
              </button>

              <button 
                onClick={handleAddFrame}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-lg shadow-indigo-600/20 active:scale-95 font-medium"
              >
                <Plus className="w-5 h-5" />
                Add New Frame
              </button>
            </div>
        </div>

        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={frames.map(f => f.id)} 
            strategy={rectSortingStrategy}
          >
            {/* 
              Grid Layout Strategy:
              - Default (Mobile): grid-cols-1
              - Small Tablet (sm): grid-cols-2
              - Desktop (lg): grid-cols-3
            */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {frames.map((frame, index) => (
                <MovieCard 
                  key={frame.id}
                  id={frame.id}
                  index={index} 
                  script={frame.script}
                  sound={frame.sound}
                  onUpdate={(field, value) => handleUpdateFrame(frame.id, field, value)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

      </main>

      <footer className="border-t border-gray-800 bg-slate-900 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} CinemaGrid App. All placeholders reserved.
        </div>
      </footer>
    </div>
  );
};

export default App;