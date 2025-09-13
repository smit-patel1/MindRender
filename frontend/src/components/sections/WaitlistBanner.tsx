import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const TOTAL_SLOTS = 100;

export default function WaitlistBanner() {
  const [email, setEmail] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  const spotsLeft = useMemo(() => {
    if (count == null) return null;
    return Math.max(0, TOTAL_SLOTS - count);
  }, [count]);

  async function fetchCount() {
    try {
      const { count, error } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      setCount(count ?? 0);
    } catch (err) {
      // best-effort; stay silent in UI for small banner
      console.warn('waitlist banner count failed:', err);
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    const channel = supabase
      .channel('waitlist-banner')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, () => fetchCount())
      .subscribe();
    return () => {
      clearInterval(id);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error && (error as any).code !== '23505') throw error; // ignore unique violation
      setJoined(true);
      setEmail('');
      await fetchCount();
      if (spotsLeft !== null && spotsLeft <= 0) {
        setMessage("You’ve joined the waitlist! While the 50% offer is full, you’ll still be among the first notified when Premium plans launch.");
      } else {
        setMessage("You’re in! You’ll be among the first to get notified when Premium plans launch — and if you’re one of the first 100, you’ll get 50% off for your first 2 months.");
      }
    } catch (err) {
      console.error('waitlist join error:', err);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4">
        <div className="rounded-xl border border-blue-400/30 bg-gradient-to-r from-blue-900/70 to-indigo-900/70 backdrop-blur-sm text-blue-50 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3">
            <div className="flex-1 text-sm">
              <span className="font-semibold">🚀 Exclusive Early Access:</span> Unlock the Future of Simulations.
              {spotsLeft != null && (
                <span className="ml-2 text-blue-200/90">
                  {spotsLeft > 0 ? `Only ${spotsLeft} of ${TOTAL_SLOTS} discounted spots left!` : `50% offer is full — join to get notified at launch.`}
                </span>
              )}
            </div>
            {!expanded && !joined && (
              <button
                onClick={() => setExpanded(true)}
                className="shrink-0 inline-flex items-center bg-yellow-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                👉 Join the Waitlist
              </button>
            )}
            {(expanded || joined) && (
              <form onSubmit={handleJoin} className="w-full sm:w-auto flex items-center gap-2">
                {joined ? (
                  <div className="text-xs sm:text-sm text-blue-100 pr-2">
                    {message || 'You’re on the list!'}
                  </div>
                ) : (
                  <>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full sm:w-64 rounded-md border border-blue-300/40 bg-white/90 text-gray-900 placeholder-gray-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center bg-yellow-500 text-black font-semibold px-3 py-2 rounded-md hover:bg-yellow-400 transition-colors disabled:opacity-60"
                    >
                      {loading ? 'Joining…' : 'Join'}
                    </button>
                  </>
                )}
              </form>
            )}
          </div>
          {message && !joined && (
            <div className="px-3 pb-3 text-xs text-blue-100">{message}</div>
          )}
        </div>
    </div>
  );
}
