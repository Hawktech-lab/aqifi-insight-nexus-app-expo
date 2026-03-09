import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

export const useDataStreams = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['data-streams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .order('stream_type');
      
      if (error) {
        console.error('Error fetching data streams:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user,
    retry: 1,
  });
};
