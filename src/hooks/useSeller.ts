import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSellerStore } from '@/stores/sellerStore';
import { useAuth } from './useAuth';

export function useSeller() {
  const { user } = useAuth();
  const { seller, setSeller } = useSellerStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSeller(null);
      setLoading(false);
      return;
    }

    const fetchSeller = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setSeller(data);
      setLoading(false);
    };

    // Only fetch if seller is not already set
    if (!seller) {
      fetchSeller();
    } else {
      setLoading(false);
    }
  }, [user, setSeller, seller]);

  return { seller, setSeller, loading };
}
