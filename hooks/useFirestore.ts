
import { useState, useCallback } from 'react';
import { doc, setDoc, getDoc } from "firebase/firestore"; 
import { db } from '../firebaseConfig';

export const useFirestore = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProject = useCallback(async (projectId: string, projectData: any, userId: string) => {
    setIsSaving(true);
    setError(null);
    try {
      if (!userId) throw new Error("User ID is required to save project");

      const data = {
        ...projectData, // Spreads { sequences: [...] } or legacy structure
        userId: userId, // CRITICAL: Required for Firestore Security Rules (resource.data.userId == auth.uid)
        lastUpdated: new Date().toISOString()
      };
      
      const projectRef = doc(db, 'projects', projectId);
      await setDoc(projectRef, data, { merge: true });
      
      return true;
    } catch (err: any) {
      console.error("Error saving project:", err);
      setError(err.message || "Failed to save project");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const projectRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(projectRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Handle migration: If old data has 'frames' but no 'sequences', wrap it
        if (data.frames && !data.sequences) {
          return {
            sequences: [
              {
                id: 'seq_default',
                title: 'Scene 1',
                frames: data.frames
              }
            ],
            projectTitle: data.title || "Untitled Project",
            aspectRatio: data.aspectRatio || "16:9"
          };
        }
        
        return {
          sequences: data.sequences || [],
          projectTitle: data.title || "Untitled Project",
          aspectRatio: data.aspectRatio || "16:9"
        };
      } else {
        console.log("No such document or permission denied!");
        return null;
      }
    } catch (err: any) {
      console.error("Error loading project:", err);
      setError(err.message || "Failed to load project");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { saveProject, loadProject, isSaving, isLoading, error };
};
