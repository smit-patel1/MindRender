import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import WaitlistBanner from '@/components/sections/WaitlistBanner';

const TOTAL_SLOTS = 100;

export default function Hero() {
  const navigate = useNavigate();
  // Mini waitlist state for the Coming Soon panel
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      console.warn('waitlist count (hero) failed:', err);
    }
  }

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    const channel = supabase
      .channel('waitlist-hero')
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
      if (error && (error as any).code !== '23505') throw error; // ignore duplicates
      setJoined(true);
      setEmail('');
      // Note: phone is collected for interest only; not stored yet
      await fetchCount();
      if (spotsLeft !== null && spotsLeft <= 0) {
        setMessage("You’ve joined the waitlist! While the 50% offer is full, you’ll still be among the first notified when Premium plans launch.");
      } else {
        setMessage("You’re in! You’ll be among the first to get notified when Premium plans launch — and if you’re one of the first 100, you’ll get 50% off for your first 2 months.");
      }
    } catch (err) {
      console.error('waitlist join (hero) error:', err);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white flex flex-col items-center justify-center p-8 pt-24">
      {/* Waitlist notification positioned within blue hero, below fixed navbar */}
      <div className="absolute top-0 left-0 right-0">
        <WaitlistBanner />
      </div>
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl"
      >
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight"
        >
          Welcome to <span className="text-yellow-400">MindRender</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-xl mb-8 text-gray-300"
        >
          An AI-powered simulation engine that transforms natural language into live, interactive simulations. Designed for learning, discovery, and exploration.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
            <Link to="/login">
            <button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg flex items-center">
              Try Demo <Sparkles className="ml-2 w-5 h-5" />
            </button>
          </Link>
          <Link to="/learn">
            <button className="border-2 border-white text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black transition-colors">
              Learn More
            </button>
          </Link>
        </motion.div>

        {/* Coming Soon + Your Info two‑column panel */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="mt-8 text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-lg p-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Coming Soon features */}
            <div>
              <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-yellow-300">
                Coming Soon
              </div>
              <ul className="space-y-3 text-blue-100">
                <li className="flex gap-3">
                  <span className="shrink-0">⚡</span>
                  <span className="text-base">
                    <span className="font-semibold">Faster simulations:</span> Near‑instant results with an optimized backend.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0">📊</span>
                  <span className="text-base">
                    <span className="font-semibold">Analytics & graphing:</span> Real‑time plots of key variables.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0">🧑‍🏫</span>
                  <span className="text-base">
                    <span className="font-semibold">AI tutor:</span> Ask questions and get tailored explanations.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0">🎮</span>
                  <div className="text-base">
                    <span className="font-semibold">Simulation Playground (flagship):</span> Build interactive labs.
                    <ul className="mt-2 list-disc pl-6 space-y-1 text-blue-200">
                      <li>
                        <span className="font-medium text-blue-100">Physics:</span> AI‑built experiments with sliders, values, and graphs.
                      </li>
                      <li>
                        <span className="font-medium text-blue-100">Math:</span> Visualize equations, functions, and geometry with controls.
                      </li>
                      <li>
                        <span className="font-medium text-blue-100">Computer Science:</span> Mini code editor + live visualizations.
                      </li>
                    </ul>
                  </div>
                </li>
              </ul>
            </div>

            {/* Right: Your Info (email + optional phone) + Live counter */}
            <div>
              <div className="mb-1 text-sm font-semibold uppercase tracking-wide text-yellow-300">
                Your Info
              </div>
              <div className="mb-3">
                <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/15 px-3 py-1 text-[11px] sm:text-xs font-semibold tracking-wide text-yellow-200">
                  50% off ALL PLANS for the First 100 Waitlist Signups!
                </span>
              </div>
              <form onSubmit={handleJoin} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="w-full rounded-lg border border-white/20 bg-white/90 text-gray-900 placeholder-gray-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  required
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="w-full rounded-lg border border-white/20 bg-white/80 text-gray-900 placeholder-gray-600 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center bg-yellow-500 text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Joining…' : 'Join Waitlist'}
                </button>
              </form>

              {/* Live counter and confirmation */}
              <div className="mt-4 text-sm">
                {spotsLeft != null && (
                  <>
                    {spotsLeft > 0 ? (
                      <div className="text-blue-100 font-medium">Only {spotsLeft} of {TOTAL_SLOTS} discounted spots left!</div>
                    ) : (
                      <div className="text-blue-100 font-medium">50% offer is full — join to get notified at launch.</div>
                    )}
                    <div className="mt-2 h-2 w-full rounded bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{ width: `${Math.min(100, ((count ?? 0) / TOTAL_SLOTS) * 100)}%` }}
                      />
                    </div>
                  </>
                )}
                {message && (
                  <div className="mt-3 text-blue-100">{message}</div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.section>
    </main>
  );
}
