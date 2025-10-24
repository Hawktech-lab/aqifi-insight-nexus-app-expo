import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import type { Tables } from '../integrations/supabase/types';

export function useDataStreams() {
  const { user } = useAuth();
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
        
        // If no data streams exist, initialize them
        if (!data || data.length === 0) {
          await initializeDataStreams();
        } else {
          // Reconcile email_metadata data_count with actual rows in email_metadata table
          try {
            const emailStream = data?.find(s => s.stream_type === 'email_metadata');
            if (emailStream) {
              const { count, error: countError } = await supabase
                .from('email_metadata')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id);

              if (!countError && typeof count === 'number' && count !== (emailStream.data_count || 0)) {
                await supabase
                  .from('data_streams')
                  .update({ 
                    data_count: count,
                    last_sync_at: new Date().toISOString()
                  })
                  .eq('id', emailStream.id);

                // Reflect immediately in local state copy
                emailStream.data_count = count as unknown as number;
                emailStream.last_sync_at = new Date().toISOString() as unknown as any;
              }
            }
          } catch (reconcileError) {
            console.error('Error reconciling email_metadata data_count (initial fetch):', reconcileError);
          }

          setDataStreams(data || []);
        }
      } catch (error) {
        console.error('Error fetching data streams:', error);
        setDataStreams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDataStreams();
  }, [user]);

  const initializeDataStreams = async () => {
    if (!user) return;

    try {
      // Check if user is a Gmail user
      const isGmailUser = user.email?.endsWith('@gmail.com') || false;
      
      const defaultStreams = [
        {
          user_id: user.id,
          stream_type: 'steps' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.001,
          last_sync_at: null,
        },
        {
          user_id: user.id,
          stream_type: 'device_metadata' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.002,
          last_sync_at: null,
        },
        // Only add email_metadata stream for Gmail users
        ...(isGmailUser ? [{
          user_id: user.id,
          stream_type: 'email_metadata' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.003,
          last_sync_at: null,
        }] : []),
        {
          user_id: user.id,
          stream_type: 'wifi' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.001,
          last_sync_at: null,
        },
        {
          user_id: user.id,
          stream_type: 'spatial' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.002,
          last_sync_at: null,
        },
        {
          user_id: user.id,
          stream_type: 'location' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.005, // Higher rate for location data
          last_sync_at: null,
        },
        {
          user_id: user.id,
          stream_type: 'behavioral' as const,
          is_enabled: false,
          data_count: 0,
          earnings_rate: 0.004,
          last_sync_at: null,
        },
      ];

      const { data, error } = await supabase
        .from('data_streams')
        .insert(defaultStreams)
        .select();

      if (error) throw error;
      
      setDataStreams(data || []);
      console.log('Data streams initialized successfully');
    } catch (error) {
      console.error('Error initializing data streams:', error);
      // toast({
      //   title: "Error",
      //   description: "Failed to initialize data streams.",
      //   variant: "destructive",
      // });
    }
  };

  const toggleDataStream = async (streamId: string, enabled: boolean) => {
    console.log('🔧 toggleDataStream called:', { streamId, enabled });
    try {
      // Update the database
      const { error } = await supabase
        .from('data_streams')
        .update({ is_enabled: enabled })
        .eq('id', streamId);

      if (error) throw error;

      console.log('🔧 Database updated successfully');
      
      // Update local state immediately after successful database update
      setDataStreams(prevStreams => 
        prevStreams.map(stream => 
          stream.id === streamId 
            ? { ...stream, is_enabled: enabled }
            : stream
        )
      );
      
      console.log('🔧 Local state updated successfully');
    } catch (error) {
      console.error('🔧 Error in toggleDataStream:', error);
      throw error; // Re-throw to let the component handle it
    }
  };

  const refreshDataStreams = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('data_streams')
        .select('*')
        .eq('user_id', user.id)
        .order('stream_type');

      if (error) throw error;
      
      // Check if Gmail user needs email_metadata stream
      const isGmailUser = user.email?.endsWith('@gmail.com') || false;
      const hasEmailStream = data?.some(stream => stream.stream_type === 'email_metadata');
      
      if (isGmailUser && !hasEmailStream) {
        // Create email_metadata stream for Gmail user
        const { data: newStream, error: insertError } = await supabase
          .from('data_streams')
          .insert({
            user_id: user.id,
            stream_type: 'email_metadata' as const,
            is_enabled: false,
            data_count: 0,
            earnings_rate: 0.003,
            last_sync_at: null,
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating email_metadata stream:', insertError);
        } else if (newStream) {
          // Add the new stream to the data
          data.push(newStream);
        }
      }

      // Reconcile email_metadata data_count with actual rows in email_metadata table
      try {
        const emailStream = data?.find(s => s.stream_type === 'email_metadata');
        if (emailStream) {
          const { count, error: countError } = await supabase
            .from('email_metadata')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          if (!countError && typeof count === 'number' && count !== (emailStream.data_count || 0)) {
            await supabase
              .from('data_streams')
              .update({ 
                data_count: count,
                last_sync_at: new Date().toISOString()
              })
              .eq('id', emailStream.id);

            // Reflect immediately in local state copy
            emailStream.data_count = count as unknown as number;
            emailStream.last_sync_at = new Date().toISOString() as unknown as any;
          }
        }
      } catch (reconcileError) {
        console.error('Error reconciling email_metadata data_count:', reconcileError);
      }
      
      setDataStreams(data || []);
    } catch (error) {
      console.error('Error refreshing data streams:', error);
      // toast({
      //   title: "Error",
      //   description: "Failed to refresh data streams.",
      //   variant: "destructive",
      // });
    }
  };

  return { 
    dataStreams, 
    loading, 
    toggleDataStream, 
    refreshDataStreams,
    initializeDataStreams,
    setDataStreams 
  };
}