import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import RealGmailAuthService, { GmailAuthResult } from '../services/RealGmailAuthService';

export interface GmailUser {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export function useGmailAuth() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GmailUser | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const gmailAuthService = RealGmailAuthService.getInstance();

  // Initialize Gmail authentication
  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user is already signed in
      const signedIn = await gmailAuthService.isSignedIn();
      setIsSignedIn(signedIn);
      
      if (signedIn) {
        const currentUser = await gmailAuthService.getCurrentUser();
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.name || '',
            photo: currentUser.photo || undefined
          });
        }
      }
    } catch (error) {
      console.error('Error initializing Gmail auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, [gmailAuthService]);

  // Sign in with Gmail
  const signIn = useCallback(async (): Promise<GmailAuthResult> => {
    try {
      setIsSigningIn(true);
      
      let result: GmailAuthResult;
      
      // Try the main OAuth flow first
      try {
        result = await gmailAuthService.signInWithGmail();
      } catch (oauthError) {
        console.warn('Main OAuth flow failed, trying fallback:', oauthError);
        
        // If OAuth fails, try the fallback method
        result = await gmailAuthService.signInWithGmailFallback();
      }
      
      if (result.success && result.user) {
        // Update UI state immediately
        setIsSignedIn(true);
        setUser(result.user);
        
        // Ensure AsyncStorage is fully written before proceeding
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a re-check of the authentication state
        await gmailAuthService.initialize();
        
        Alert.alert(
          'Success', 
          `Signed in as ${result.user.email}`
        );
      } else {
        Alert.alert(
          'Sign In Failed', 
          result.error || 'Failed to sign in to Gmail'
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error signing in:', error);
      const errorResult: GmailAuthResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      };
      
      Alert.alert('Error', errorResult.error);
      return errorResult;
    } finally {
      setIsSigningIn(false);
    }
  }, [gmailAuthService]);

  // Sign out from Gmail
  const signOut = useCallback(async () => {
    try {
      await gmailAuthService.signOut();
      setIsSignedIn(false);
      setUser(null);
      
      Alert.alert('Success', 'Signed out from Gmail');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  }, [gmailAuthService]);

  // Get access token
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      return await gmailAuthService.getAccessToken();
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }, [gmailAuthService]);

  // Check if user has Gmail account
  const isGmailUser = useCallback((): boolean => {
    return user?.email?.endsWith('@gmail.com') || false;
  }, [user]);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // State
    isSignedIn,
    isLoading,
    isSigningIn,
    user,
    
    // Actions
    signIn,
    signOut,
    initialize,
    
    // Utilities
    getAccessToken,
    isGmailUser
  };
}