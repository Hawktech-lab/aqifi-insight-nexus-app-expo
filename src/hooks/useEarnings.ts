import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export function useEarnings() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Tables<'earnings_transactions'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('earnings_transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setTransactions(data || []);
      } catch (error) {
        console.error('Error fetching earnings:', error);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [user]);

  return { transactions, loading };
}