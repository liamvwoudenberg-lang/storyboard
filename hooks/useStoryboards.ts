
import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';

export interface StoryboardSummary {
  id: string;
  title: string;
  updatedAt: any;
  ownerId: string;
}

export const useStoryboards = () => {
  const [docs, setDocs] = useState<StoryboardSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setDocs([]);
      setLoading(false);
      return;
    }

    // Subscribe to projects where I am the owner
    // Note: You might need a second query later for "Projects shared with me"
    const q = query(
      collection(db, 'storyboards'), 
      where("ownerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: StoryboardSummary[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({ 
            id: doc.id, 
            title: data.projectTitle || 'Untitled', // specific to your schema
            updatedAt: data.lastEdited,
            ownerId: data.ownerId
        });
      });
      setDocs(results);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching storyboards:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { docs, loading };
};
