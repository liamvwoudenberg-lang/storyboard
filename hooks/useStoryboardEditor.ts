import { useState, useCallback, useRef } from 'react';
import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  setDoc, 
  collection, 
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

const debounce = (func: Function, delay: number) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const useStoryboardEditor = () => {
  const [currentDoc, setCurrentDoc] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // 1. Helper to update local state immediately (Optimistic UI)
  const updateLocalState = useCallback((newData: any) => {
    setCurrentDoc((prev: any) => {
        if (!prev) return prev;
        return { ...prev, ...newData };
    });
  }, []);

  // 2. CREATE
  const createStoryboard = useCallback(async (userId: string, title: string) => {
    setStatus('loading');
    try {
      const newDocRef = doc(collection(db, 'storyboards'));
      const initialData = {
        projectTitle: title,
        ownerId: userId,
        roles: { [userId]: 'owner' },
        publicAccess: 'none',
        aspectRatio: '16:9',
        sequences: [
          {
            id: 'seq_1',
            title: 'Scene 1',
            frames: [
              {
                id: 'frame_1',
                description: 'This is your first frame!',
                image: '',
                duration: 3,
                cameraAngle: 'eye-level',
                cameraMovement: 'static',
                sound: 'none',
                dialogue: '',
              }
            ]
          }
        ],
        createdAt: serverTimestamp(),
        lastEdited: serverTimestamp(),
      };

      await setDoc(newDocRef, initialData);
      setStatus('idle');
      return newDocRef.id;
    } catch (err: any) {
      console.error("Create error:", err);
      setError(err.message);
      setStatus('error');
      return null;
    }
  }, []);

  // 3. SUBSCRIBE
  const subscribeToStoryboard = useCallback((docId: string) => {
    setStatus('loading');
    const docRef = doc(db, 'storyboards', docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentDoc({ id: docSnap.id, ...docSnap.data() });
        setStatus('idle');
      } else {
        setError("Document not found");
        setStatus('error');
      }
    }, (err) => {
      console.error("Subscription error:", err);
      if (err.code === 'permission-denied') {
        setError("You do not have access to this storyboard.");
      } else {
        setError("Failed to load storyboard.");
      }
      setStatus('error');
    });

    return unsubscribe;
  }, []);

  // 4. DEBOUNCED SAVE
  const debouncedSave = useRef(
    debounce(async (docId: string, data: any) => {
      try {
        const docRef = doc(db, 'storyboards', docId);
        await updateDoc(docRef, {
          ...data,
          lastEdited: serverTimestamp()
        });
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, 1000)
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
    manualSave,
    debouncedSave,
    updateLocalState // <--- Export this new function
  };
};