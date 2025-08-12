import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CallToAction() {
  return (
    <section className="bg-gradient-to-br from-blue-600 to-purple-700 py-20">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center text-white px-4"
      >
        <h2 className="text-4xl md:text-5xl font-bold mb-6">Transform Your Ideas Into Reality</h2>
        <p className="text-xl mb-12">Begin creating interactive simulations from your concepts today.</p>
        <Link to="/login">
          <button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg flex items-center">
            Get Started Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </Link>
      </motion.div>
    </section>
  );
}