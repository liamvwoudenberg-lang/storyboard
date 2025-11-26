import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  googleSignIn: () => Promise<void>;
  emailSignUp: (email: string, pass: string, name: string) => Promise<void>;
  emailSignIn: (email: string, pass: string) => Promise<void>;
  anonymousSignIn: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------------
  // 1. Create User Document Logic
  // ---------------------------------------------------------
  const createUserDocument = async (user: User, additionalData?: any) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const { email, displayName, uid } = user;
        const createdAt = new Date().toISOString();

        await setDoc(userRef, {
          uid,
          email,
          displayName,
          createdAt,
          ...additionalData
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error creating user document", error);
    }
  };

  // ---------------------------------------------------------
  // 2. Auth Actions
  // ---------------------------------------------------------
  
  const googleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user);
    } catch (error) {
      throw error;
    }
  };

  const emailSignUp = async (email: string, pass: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      
      // Update the Auth Profile
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }

      // Create the Firestore Document
      // Note: We pass name manually because result.user.displayName might not update immediately in the object
      await createUserDocument(result.user, { displayName: name });
    } catch (error) {
      throw error;
    }
  };

  const emailSignIn = async (email: string, pass: string) => {
    try {
      // Login doesn't usually need to create a doc, but we can check if we want
      // For now, standard login
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      throw error;
    }
  };

  const anonymousSignIn = async () => {
    try {
      await firebaseSignInAnonymously(auth);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // ---------------------------------------------------------
  // 3. Auth Listener
  // ---------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    googleSignIn,
    emailSignUp,
    emailSignIn,
    anonymousSignIn,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
