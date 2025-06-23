import React from 'react';
import { motion } from 'framer-motion';

export default function Problem() {
  return (
    <section className="bg-gray-100 py-20">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto"
        >
          <div>
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Why MindRender?</h2>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              Traditional educational tools often fall short in providing interactive, real-time learning experiences. Static diagrams and pre-recorded videos cannot adapt to individual learning needs or demonstrate dynamic concepts effectively.
            </p>
            <p className="text-xl text-gray-600 leading-relaxed">
              MindRender bridges this gap by instantly generating custom, interactive simulations that respond to your specific questions and requirements, making complex topics easier to understand and remember.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <div className="aspect-square rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600">
              <img 
                src="/image copy.png" 
                alt="MindRender Interface - Generate interactive simulations from text prompts with visual explanations"
                className="w-full h-full object-contain rounded-xl"
                loading="lazy"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}