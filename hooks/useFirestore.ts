
import { useState, useEffect, useCallback } from 'react';
import { db } from '../firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export const useFirestore = (collectionName?: string) => {
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  // Effect for fetching a collection (for the Dashboard)
  useEffect(() => {
    if (collectionName && user) {
      setIsLoading(true);
      const q = query(collection(db, collectionName), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const documents: any[] = [];
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        setDocs(documents);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching Firestore documents:", error);
        setIsLoading(false);
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
      // If no collection name is provided, don't attempt to load a collection.
      setIsLoading(false);
    }
  }, [collectionName, user]);

  // Callback for loading a single document (for the Editor)
  const loadProject = useCallback(async (projectId: string) => {
    setIsLoading(true);
    try {
      const docRef = doc(db, 'storyboards', projectId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        console.log("No such document!");
        return null;
      }
    } catch (error) {
      console.error("Error loading project:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Callback for saving a single document (for the Editor)
  const saveProject = useCallback(async (projectId: string, data: any, userId: string | null) => {
    setIsSaving(true);
    try {
      const docRef = doc(db, 'storyboards', projectId);
      const dataToUpdate: any = {
        ...data,
        lastEdited: serverTimestamp(),
      };

      if (userId) {
        dataToUpdate.userId = userId;
      }
      
      await updateDoc(docRef, dataToUpdate);
    } catch (error) {
      console.error("Error saving project:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { docs, isLoading, loadProject, saveProject, isSaving };
};
