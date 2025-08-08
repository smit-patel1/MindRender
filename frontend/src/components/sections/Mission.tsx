import React from 'react';
import { motion } from 'framer-motion';

export default function Mission() {
  return (
    <section className="bg-white py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4"
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Mission</h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            We believe that understanding complex concepts should not be limited
            by static textbooks or traditional learning methods. MindRender
            democratizes education by putting the power of real-time,
            interactive visualization in everyone&apos;s hands. Through
            AI-powered simulations, we are making abstract concepts tangible and
            learning more engaging than ever before.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
