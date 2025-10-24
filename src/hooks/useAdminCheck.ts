import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const checkAdminRole = async () => {
      if (!user) {
        if (isMounted) {
          setIsAdmin(false);
          setLoading(false);
        }
        return;
      }
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (!isMounted) return;
        
        const isAdminUser = profile?.role === 'admin';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin role:', error);
        if (isMounted) {
          setIsAdmin(false);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkAdminRole();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id, not the entire user object

  return { isAdmin, loading };
}