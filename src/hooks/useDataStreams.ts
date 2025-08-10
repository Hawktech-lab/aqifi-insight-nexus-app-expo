import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/components/ui/use-toast';

export function useDataStreams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dataStreams, setDataStreams] = useState<Tables<'data_streams'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDataStreams = async () => {
      if (!user) {
        setDataStreams([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('data_streams')
          .select('*')
          .eq('user_id', user.id)
          .order('stream_type');

        if (error) throw error;
        setDataStreams(data || []);
      } catch (error) {
        console.error('Error fetching data streams:', error);
        setDataStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDataStreams();
  }, [user]);

  const toggleDataStream = async (streamId: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('data_streams')
        .update({ is_enabled: enabled })
        .eq('id', streamId);

      if (error) throw error;

      setDataStreams(prev => 
        prev.map(stream => 
          stream.id === streamId 
            ? { ...stream, is_enabled: enabled }
            : stream
        )
      );

      toast({
        title: enabled ? "Data stream enabled" : "Data stream disabled",
        description: `You've ${enabled ? 'enabled' : 'disabled'} this data stream.`,
      });
    } catch (error) {
      console.error('Error updating data stream:', error);
      toast({
        title: "Error",
        description: "Failed to update data stream settings.",
        variant: "destructive",
      });
    }
  };

  return { dataStreams, loading, toggleDataStream };
}