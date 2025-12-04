import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust this path if needed

const useProject = (projectId) => {
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, 'storyboards', projectId);

    const unsubscribe = onSnapshot(projectRef, (doc) => {
      setProject(doc.data());
    });

    // Presence - Mark user as active
    const presenceRef = doc(db, 'storyboards', projectId);
    updateDoc(presenceRef, { 
      [`activeUsers.${localStorage.getItem('userId')}`]: true
    });

    // Mark user as inactive on disconnect
    window.addEventListener('beforeunload', () => {
      updateDoc(presenceRef, { 
        [`activeUsers.${localStorage.getItem('userId')}`]: false
      });
    });

    return () => unsubscribe();
  }, [projectId]);

  return project;
};

export default useProject;