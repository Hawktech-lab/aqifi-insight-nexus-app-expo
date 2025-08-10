import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useAdminCheck() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      
      try {
        console.log('Admin Check - User ID:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        console.log('Admin Check - Profile data:', profile);
        console.log('Admin Check - Query error:', error);
        
        const isAdminUser = profile?.role === 'admin';
        console.log('Admin Check - Is admin:', isAdminUser);
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  return { isAdmin, loading };
}