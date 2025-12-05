
import { useState, useCallback, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  collection, 
  serverTimestamp, 
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Debounce Helper
// We put this outside to ensure it doesn't re-create unnecessarily
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const useStoryboardEditor = () => {
  const [currentDoc, setCurrentDoc] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // 1. CREATE (Fixes the ID bug)
  const createStoryboard = useCallback(async (userId: string, title: string) => {
    setStatus('loading');
    try {
      // Create a reference with an AUTO-GENERATED ID
      const newDocRef = doc(collection(db, 'storyboards'));
      
      const initialData = {
        projectTitle: title,
        ownerId: userId,
        roles: { [userId]: 'owner' }, // Matches your Rules
        publicAccess: 'none',
        aspectRatio: '16:9',
        frames: [], // Array for storyboard frames
        createdAt: serverTimestamp(),
        lastEdited: serverTimestamp(),
      };

      await setDoc(newDocRef, initialData);
      setStatus('idle');
      return newDocRef.id; // Return ID so UI can redirect
    } catch (err: any) {
      console.error("Create error:", err);
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, []);

  // 2. SUBSCRIBE (Real-time listener for the editor)
  const subscribeToStoryboard = useCallback((docId: string) => {
    setStatus('loading');
    
    const docRef = doc(db, 'storyboards', docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        // We merge the ID into the data object
        setCurrentDoc({ id: docSnap.id, ...docSnap.data() });
        setStatus('idle');
      } else {
        setError("Document not found");
        setStatus('error');
      }
    }, (err) => {
      console.error("Subscription error:", err);
      // Nice user feedback if permission denied
      if (err.code === 'permission-denied') {
        setError("You do not have access to this storyboard.");
      } else {
        setError("Failed to load storyboard.");
      }
      setStatus('error');
    });

    return unsubscribe; // Return cleanup function
  }, []);

  // 3. DEBOUNCED UPDATE (Prevents too many writes)
  // We use useRef to keep the debounced function stable across renders
  const debouncedSave = useRef(
    debounce(async (docId: string, data: any) => {
      try {
        const docRef = doc(db, 'storyboards', docId);
        await updateDoc(docRef, {
          ...data,
          lastEdited: serverTimestamp()
        });
        // We don't set status to 'idle' here to avoid UI flickering
        // The onSnapshot listener will update the local state
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1000) // Wait 1 second after typing stops
  ).current;

  const manualSave = useCallback(async (docId: string, data: any) => {
    setStatus('saving');
    await debouncedSave(docId, data);
    setStatus('idle');
  }, []);

  return {
    currentDoc,
    status,
    error,
    createStoryboard,
    subscribeToStoryboard,
    manualSave,   // Immediate save
    debouncedSave // Auto-save
  };
};
