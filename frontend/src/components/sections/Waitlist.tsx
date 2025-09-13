import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const TOTAL_SLOTS = 100;

export default function Waitlist() {
  const [email, setEmail] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const spotsLeft = useMemo(() => {
    if (count == null) return null;
    const left = Math.max(0, TOTAL_SLOTS - count);
    return left;
  }, [count]);

  async function fetchCount() {
    try {
      const { count, error } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      setCount(count ?? 0);
    } catch (err) {
      // Fallback: leave count as-is
      console.warn('Failed to fetch waitlist count:', err);
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    // Try realtime updates if enabled
    const channel = supabase
      .channel('waitlist-count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'waitlist' },
        () => fetchCount()
      )
      .subscribe();
    return () => {
      clearInterval(id);
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  const handleJoin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.from('waitlist').insert({ email });
      if (error && (error as any).code !== '23505') {
        // 23505 = unique_violation; treat as already joined
        throw error;
      }
      setJoined(true);
      setMessage(
        spotsLeft && spotsLeft <= 0
          ? `You’ve joined the waitlist! While the 50% offer is full, you’ll still be among the first notified when Premium plans launch.`
          : `You’re in! You’ll be among the first to get notified when Premium plans launch — and if you’re one of the first 100, you’ll get 50% off for your first 2 months.`
      );
      setEmail('');
      await fetchCount();
    } catch (err: any) {
      console.error('Join waitlist failed:', err);
      setMessage('Something went wrong. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
                <span>🚀 Exclusive Early Access: Unlock the Future of Simulations</span>
              </h2>
              <p className="mt-3 text-blue-50 text-sm sm:text-base">
                Join the waitlist today. The first 100 users will receive 50% off Premium plans for 2 months when they launch. Be among the first to explore the most advanced AI-powered simulation platform.
              </p>
              {spotsLeft != null && spotsLeft > 0 && (
                <p className="mt-3 text-white/90 text-sm font-semibold">
                  Only {spotsLeft} of {TOTAL_SLOTS} discounted spots left!
                </p>
              )}
              {spotsLeft != null && spotsLeft <= 0 && (
                <p className="mt-3 text-yellow-100 text-sm font-semibold">
                  The 50% offer is full, but you can still join the waitlist to be notified at launch.
                </p>
              )}
            </div>

            <form onSubmit={handleJoin} className="bg-white p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining…' : '👉 Join the Waitlist'}
                </button>
              </div>

              {message && (
                <div className="mt-4 text-sm text-gray-700">
                  {message}
                </div>
              )}

              {!joined && (
                <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-semibold">⚡ Faster Simulations</div>
                    <div className="text-gray-600">Near-instant results with optimized backend.</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-semibold">📊 Analytics & Graphing</div>
                    <div className="text-gray-600">Real-time plots of key variables.</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-semibold">🧑‍🏫 AI Tutor</div>
                    <div className="text-gray-600">Ask questions and get tailored explanations.</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="font-semibold">🎮 Simulation Playground (Flagship)</div>
                    <div className="text-gray-600">
                      Design your own interactive labs: Physics, Math, Computer Science.
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
