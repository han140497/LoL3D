import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';

function isTodayIndependenceDay() {
  const now = new Date();
  return now.getMonth() === 7 && now.getDate() === 15;
}

// Returns the single currently-active campaign (if any).
export async function fetchActiveCampaign() {
  if (!isSupabaseConfigured) {
    // Offline: return the Independence Day campaign only on Aug 15
    if (isTodayIndependenceDay()) {
      return {
        id: 1,
        name: "India's Independence Day",
        banner_text: "Happy Independence Day! 🇮🇳 Get 20% off your first order — today only!",
        discount_percent: 20,
        first_order_only: true,
        requires_signup: true,
      };
    }
    return null;
  }
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('active', true)
    .lte('starts_at', new Date().toISOString())
    .or('ends_at.is.null,ends_at.gt.' + new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error('[LoL3D] campaign fetch failed:', error.message);
    return null;
  }
  return data;
}

// Returns true when the authenticated user has no previous orders.
export async function isFirstOrderUser(userId) {
  if (!isSupabaseConfigured) return true;
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .neq('status', 'cancelled');
  if (error) {
    console.error('[LoL3D] first-order check failed:', error.message);
    return false;
  }
  return count === 0;
}

// Hook: returns { campaign, eligible, discountPct, loading }
// eligible = user qualifies for the campaign discount right now
// discountPct = fraction to deduct (e.g. 0.20 for 20%)
export function useCampaignDiscount() {
  const { user } = useAuth();
  const [campaign, setCampaign] = useState(null);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const c = await fetchActiveCampaign();
      if (cancelled) return;
      if (!c || c.discount_percent === 0) {
        setCampaign(null);
        setEligible(false);
        setLoading(false);
        return;
      }
      setCampaign(c);

      if (!c.first_order_only) {
        setEligible(Boolean(user));
        setLoading(false);
        return;
      }

      if (!user) {
        setEligible(false);
        setLoading(false);
        return;
      }

      const first = await isFirstOrderUser(user.id);
      if (!cancelled) {
        setEligible(first);
        setLoading(false);
      }
    }
    check();
    return () => { cancelled = true; };
  }, [user]);

  const discountPct = eligible ? (campaign?.discount_percent ?? 0) / 100 : 0;
  return { campaign, eligible, discountPct, loading };
}
