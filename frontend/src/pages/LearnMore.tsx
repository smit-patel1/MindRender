import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function LearnMore() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header Section */}
          <h1 className="text-5xl font-bold text-center mb-12">About MindRender</h1>

          {/* Description Paragraphs */}
          <div className="space-y-6 mb-16 text-lg text-gray-300">
            <p>
              MindRender is an AI-powered simulation engine that transforms natural language prompts into real-time visualizations. Our platform bridges the gap between abstract concepts and tangible understanding through interactive, dynamic simulations.
            </p>
            <p>
              Designed for students, educators, and independent learners, MindRender helps users grasp complex topics in subjects like mathematics, biology, and computer science. By providing hands-on, intuitive ways to explore technical subjects, we make learning more engaging and effective.
            </p>
            <p>
              The system leverages advanced large language models and code generation capabilities to create sophisticated canvas-based and animation-based visual outputs that respond to user input in real time.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="bg-gray-800/50 rounded-2xl p-8 mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center">How It Works</h2>
            <div className="space-y-4">
              {[
                "Users type a natural language prompt describing their desired visualization",
                "MindRender uses an LLM to analyze the prompt and generate appropriate visualization code",
                "The simulation renders instantly in your browser, creating an interactive experience",
                "Users can interact with and modify the simulation in real time to explore different scenarios"
              ].map((step, index) => (
                <div key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                    {index + 1}
                  </span>
                  <p className="text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-xl mb-8">
              Ready to experience the power of interactive learning? Start exploring complex concepts through dynamic visualizations.
            </p>
            <Link to="/demo">
              <button className="bg-yellow-500 text-black hover:bg-yellow-400 px-8 py-6 rounded-2xl text-lg font-semibold shadow-lg transition-colors">
                Try the Demo
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}