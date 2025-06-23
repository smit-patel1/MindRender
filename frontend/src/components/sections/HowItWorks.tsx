import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Code2, Play, MousePointer } from 'lucide-react';

const steps = [
  {
    icon: MessageSquare,
    title: "Describe",
    description: "Describe what you want to visualize using simple, natural language"
  },
  {
    icon: Code2,
    title: "Generate",
    description: "Our AI transforms your description into working interactive code"
  },
  {
    icon: Play,
    title: "Visualize",
    description: "See your concept come to life as a real-time simulation"
  },
  {
    icon: MousePointer,
    title: "Explore",
    description: "Interact with and customize the simulation while you learn"
  }
];

export default function HowItWorks() {
  return (
    <section className="bg-gray-900 py-20 text-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-6">How MindRender Works</h2>
        </motion.div>
        
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition-colors"
            >
              <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}