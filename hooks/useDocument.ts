import { useState, useEffect, useRef, useCallback } from 'react';
import {
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
  serverTimestamp,
  Firestore,
  DocumentData,
  Unsubscribe,
} from 'firebase/firestore';
import { app } from '../firebaseConfig'; // Assuming firebaseConfig.ts exports your initialized app

interface Document {
  id: string;
  title: string;
  content: string | Record<string, any>;
  ownerId: string;
  roles: Record<string, 'viewer' | 'editor' | 'owner'>;
  publicAccess: 'none' | 'viewer' | 'editor';
  createdAt: any;
  updatedAt: any;
}

const firestore: Firestore = getFirestore(app);

// Debounce function
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

export const useDocument = () => {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Creates a new document in Firestore.
   * @param userId The UID of the creator.
   * @param title The initial title of the document.
   * @param initialContent The initial content of the document.
   * @returns The ID of the newly created document.
   */
  const createDocument = useCallback(async (userId: string, title: string, initialContent: string | Record<string, any> = '') => {
    try {
      setLoading(true);
      setError(null);
      const newDocRef = doc(firestore, 'documents', 'newDoc'); // Firestore will auto-generate a unique ID
      await setDoc(newDocRef, {
        title,
        content: initialContent,
        ownerId: userId,
        roles: { [userId]: 'owner' },
        publicAccess: 'none',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return newDocRef.id;
    } catch (err) {
      console.error('Error creating document:', err);
      setError('Failed to create document.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Subscribes to a document for real-time updates.
   * @param docId The ID of the document to subscribe to.
   * @param callback A function to be called with the updated document data.
   * @returns An unsubscribe function to stop the listener.
   */
  const subscribeToDocument = useCallback((docId: string, callback: (doc: Document | null) => void): Unsubscribe => {
    const docRef = doc(firestore, 'documents', docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Omit<Document, 'id'>;
        const fetchedDoc: Document = { id: docSnap.id, ...data };
        setDocument(fetchedDoc);
        callback(fetchedDoc);
        setLoading(false);
      } else {
        setDocument(null);
        callback(null);
        setLoading(false);
        setError('Document not found.');
      }
    }, (err) => {
      console.error('Error subscribing to document:', err);
      setError('Failed to subscribe to document updates.');
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  /**
   * Debounced function to update the content of a document.
   * @param docId The ID of the document to update.
   * @param newContent The new content for the document.d
   */
  const updateDocumentContent = useCallback(
    debounce(async (docId: string, newContent: string | Record<string, any>) => {
      try {
        const docRef = doc(firestore, 'documents', docId);
        await setDoc(docRef, { content: newContent, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.error('Error updating document content:', err);
        setError('Failed to update document content.');
      }
    }, 500),
    []
  );

  /**
   * Updates the sharing settings of a document.
   * @param docId The ID of the document to update.
   * @param settings An object containing the new publicAccess level and/or roles.
   */
  const updateSharingSettings = useCallback(async (
    docId: string,
    settings: { publicAccess?: 'none' | 'viewer' | 'editor'; roles?: Record<string, 'viewer' | 'editor' | 'owner'> }
  ) => {
    try {
      setLoading(true);
      setError(null);
      const docRef = doc(firestore, 'documents', docId);
      await setDoc(docRef, { ...settings, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.error('Error updating sharing settings:', err);
      setError('Failed to update sharing settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    document,
    loading,
    error,
    createDocument,
    subscribeToDocument,
    updateDocumentContent,
    updateSharingSettings,
  };
};