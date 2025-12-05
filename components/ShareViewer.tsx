
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MovieCard from './MovieCard';
import { Loader2 } from 'lucide-react';
import { useStoryboardEditor } from '../hooks/useStoryboardEditor';

// Reusing interfaces from Editor
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
  comments?: { id: string, text: string, author: string, createdAt: any }[];
}

interface SequenceData {
  id: string;
  title: string;
  frames: FrameData[];
}

const ShareViewer: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();

  const { 
    currentDoc: project, 
    status, 
    error, 
    subscribeToStoryboard, 
    debouncedSave 
  } = useStoryboardEditor();

  const [activeCommentFrameId, setActiveCommentFrameId] = useState<string | number | null>(null);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (projectId) {
      const unsubscribe = subscribeToStoryboard(projectId);
      return () => unsubscribe();
    }
  }, [projectId, subscribeToStoryboard]);

  const handleAddComment = async (frameId: string | number) => {
    if (!newComment.trim() || !projectId || !project) return;

    const commentData = {
       id: `comment_${Date.now()}`,
       text: newComment,
       author: "Guest",
       createdAt: new Date().toISOString() // Using client time for simplicity here
    };

    const updatedSequences = project.sequences.map(seq => ({
       ...seq,
       frames: seq.frames.map(f => {
          if (f.id === frameId) {
             return { ...f, comments: [...(f.comments || []), commentData] };
          }
          return f;
       })
    }));

    debouncedSave(projectId, { sequences: updatedSequences });
    
    setNewComment("");
    setActiveCommentFrameId(null);
  };

  if (status === 'loading') return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;
  if (error) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-400">Error: {error}</div>;
  if (!project) return <div className="min-h-screen bg-slate-950 flex items-center justify-center">Project not found.</div>;

  let globalFrameCount = 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
       <header className="h-16 border-b border-gray-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
             <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
               S
             </div>
             <h1 className="font-bold text-lg tracking-tight">Storybored <span className="text-gray-500 font-normal mx-2">/</span> <span className="text-indigo-300">{project.projectTitle}</span></h1>
          </div>
          <div className="text-xs font-medium px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
             Read-Only View
          </div>
       </header>

       <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="space-y-12">
             {project.sequences.map((sequence) => {
                const currentGlobalIndex = globalFrameCount;
                globalFrameCount += sequence.frames.length;

                return (
                   <div key={sequence.id} className="space-y-6">
                      <h2 className="text-2xl font-bold text-slate-200 border-b border-gray-800 pb-2">{sequence.title}</h2>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
                         {sequence.frames.map((frame, index) => (
                            <div key={frame.id} className="flex flex-col gap-3">
                               <MovieCard
                                  id={frame.id}
                                  index={currentGlobalIndex + index}
                                  script={frame.script}
                                  sound={frame.sound}
                                  imageUrl={frame.imageUrl}
                                  videoUrl={frame.videoUrl}
                                  audioUrl={frame.audioUrl}
                                  aspectRatio={project.aspectRatio}
                                  shotType={frame.shotTshotType}
                                  cameraMove={frame.cameraMove}
                                  drawingData={frame.drawingData}
                                  onUpdate={() => {}} // No-op
                                  onDelete={() => {}} // No-op
                                  readOnly={true}
                               />
                               
                               <div className="bg-slate-900 border border-gray-800 rounded-lg p-3 text-sm">
                                  {frame.comments && frame.comments.length > 0 && (
                                     <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                                        {frame.comments.map(comment => (
                                           <div key={comment.id} className="text-gray-300 bg-slate-800/50 p-2 rounded">
                                              <span className="text-xs text-indigo-400 font-bold block">{comment.author}</span>
                                              {comment.text}
                                           </div>
                                        ))}
                                     </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                     <input 
                                        type="text" 
                                        placeholder="Add a comment..." 
                                        className="flex-1 bg-slate-950 border border-gray-700 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
                                        value={activeCommentFrameId === frame.id ? newComment : ""}
                                        onChange={(e) => {
                                           setActiveCommentFrameId(frame.id);
                                           setNewComment(e.target.value);
                                        }}
                                        onKeyDown={(e) => {
                                           if (e.key === 'Enter') handleAddComment(frame.id);
                                        }}
                                     />
                                     <button 
                                        onClick={() => handleAddComment(frame.id)}
                                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded"
                                     >
                                        Post
                                     </button>
                                  </div>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                );
             })}
          </div>
       </main>
    </div>
  );
};

export default ShareViewer;
