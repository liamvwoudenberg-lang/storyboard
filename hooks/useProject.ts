import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from '../context/AuthContext';

const useProject = (projectId) => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId || !user) return;

    const projectRef = doc(db, 'storyboards', projectId);
    const userId = user.uid;

    const unsubscribe = onSnapshot(projectRef, (doc) => {
      setProject(doc.data());
    });

    // Presence - Mark user as active
    updateDoc(projectRef, { 
      [`activeUsers.${userId}`]: true
    });

    const handleBeforeUnload = () => {
      updateDoc(projectRef, { 
        [`activeUsers.${userId}`]: false
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      // Mark user as inactive when component unmounts or user changes
      updateDoc(projectRef, { 
        [`activeUsers.${userId}`]: false
      });
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [projectId, user]);

  return project;
};

export default useProject;