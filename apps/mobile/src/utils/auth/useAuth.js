import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { create } from 'zustand';
import { supabase } from './supabase';

// Auth store using Zustand
export const useAuthStore = create((set, get) => ({
  isReady: false,
  session: null,
  user: null,
  setSession: (session) => {
    set({
      session,
      user: session?.user || null,
      isReady: true
    });
  },
}));

// Modal store for auth UI
export const useAuthModal = create((set) => ({
  isOpen: false,
  mode: 'signup',
  open: (options) => set({ isOpen: true, mode: options?.mode || 'signup' }),
  close: () => set({ isOpen: false }),
}));

/**
 * This hook provides authentication functionality using Supabase.
 */
export const useAuth = () => {
  const { isReady, session, user, setSession } = useAuthStore();
  const { isOpen, close, open } = useAuthModal();

  const initiate = useCallback(async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session);
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('Error initializing auth:', error);
      setSession(null);
    }
  }, [setSession]);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      close();
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  }, [close]);

  const signUp = useCallback(async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      close();
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  }, [close]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      close();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [close]);

  const openSignIn = useCallback(() => {
    open({ mode: 'signin' });
  }, [open]);

  const openSignUp = useCallback(() => {
    open({ mode: 'signup' });
  }, [open]);

  return {
    isReady,
    isAuthenticated: isReady ? !!session : null,
    session,
    user,
    signIn,
    signOut,
    signUp,
    openSignIn,
    openSignUp,
    initiate,
  };
};

/**
 * This hook will automatically open the authentication modal if the user is not authenticated.
 */
export const useRequireAuth = (options) => {
  const { isAuthenticated, isReady } = useAuth();
  const { open } = useAuthModal();

  useEffect(() => {
    if (!isAuthenticated && isReady) {
      open({ mode: options?.mode });
    }
  }, [isAuthenticated, open, options?.mode, isReady]);
};

export default useAuth;
