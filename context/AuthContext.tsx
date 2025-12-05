
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
  isGuest: boolean;
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
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  const createUserDocument = async (user: User, additionalData?: any) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const { email, displayName, uid, isAnonymous } = user;
        const createdAt = new Date().toISOString();

        await setDoc(userRef, {
          uid,
          email: email || null,
          displayName: displayName || `Guest-${uid.substring(0,5)}`,
          createdAt,
          isGuest: isAnonymous,
          ...additionalData
        }, { merge: true });
      }
    } catch (error) {
      console.error("Error creating user document", error);
    }
  };

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
      await updateProfile(result.user, { displayName: name });
      await createUserDocument(result.user, { displayName: name });
    } catch (error) {
      throw error;
    }
  };

  const emailSignIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
      throw error;
    }
  };

  const anonymousSignIn = async () => {
    try {
      const result = await firebaseSignInAnonymously(auth);
      await createUserDocument(result.user);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsGuest(currentUser?.isAnonymous || false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = {
    user,
    isGuest,
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
