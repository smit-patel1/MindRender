import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';

export default function Hero() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white flex flex-col items-center justify-center p-8">
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
          {loading ? (
            <div className="bg-gray-700 px-8 py-6 rounded-2xl text-lg font-semibold animate-pulse">
              Loading...
            </div>
          ) : (
            <Link to={user ? "/profile" : "/auth"}>
              <button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg flex items-center">
                {user ? "Go to Profile" : "Try Demo"} <Sparkles className="ml-2 w-5 h-5" />
              </button>
            </Link>
          )}
          <Link to="/learn">
            <button className="border-2 border-white text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-white hover:text-black transition-colors">
              Learn More
            </button>
          </Link>
        </motion.div>
      </motion.section>
    </main>
  );
}