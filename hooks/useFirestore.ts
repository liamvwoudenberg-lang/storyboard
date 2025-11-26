import { useState, useCallback } from 'react';
import { db } from '../firebaseConfig';

export const useFirestore = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProject = useCallback(async (projectId: string, frames: any[]) => {
    setIsSaving(true);
    setError(null);
    try {
      const data = {
        frames: frames,
        lastUpdated: new Date().toISOString()
      };
      
      // Use v8 namespaced syntax
      await db.collection('projects').doc(projectId).set(data, { merge: true });
      
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
      // Use v8 namespaced syntax
      const docSnap = await db.collection('projects').doc(projectId).get();
      
      // In v8, .exists is a property, not a method
      if (docSnap.exists) {
        const data = docSnap.data();
        return data?.frames || [];
      } else {
        console.log("No such document!");
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