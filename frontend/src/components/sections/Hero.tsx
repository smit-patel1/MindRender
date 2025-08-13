import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="mx-auto max-w-5xl lg:max-w-7xl px-4 pt-24 pb-16 lg:pt-20 lg:pb-14 text-center sm:text-left">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight"
        >
          Welcome to <span className="text-yellow-400">MindRender</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl mb-8 text-gray-300"
        >
          An AI-powered simulation engine that transforms natural language into live, interactive simulations. Designed for learning, discovery, and exploration.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-6 flex flex-col sm:flex-row items-center sm:items-stretch gap-4"
        >
          <Link to="/demo" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto bg-yellow-500 text-black px-6 py-3 rounded-xl font-semibold hover:bg-yellow-400">
              Try Demo <Sparkles className="ml-2 w-5 h-5" />
            </button>
          </Link>
          <Link to="/learn" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto border border-white/30 text-white px-6 py-3 rounded-xl hover:bg-white/10">
              Learn More
            </button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}