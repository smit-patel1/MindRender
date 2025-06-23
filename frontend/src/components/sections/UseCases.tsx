import React from 'react';
import { motion } from 'framer-motion';
import { Code, Dna, LineChart } from 'lucide-react';

const cases = [
  {
    icon: Code,
    title: "Binary Search Visualization",
    description: "See how the algorithm efficiently locates elements in sorted arrays",
    prompt: "Visualize binary search algorithm"
  },
  {
    icon: Dna,
    title: "Cell Division Process",
    description: "Explore the stages of mitosis in an interactive 3D environment",
    prompt: "Show how mitosis works"
  },
  {
    icon: LineChart,
    title: "Population Dynamics",
    description: "Study predator-prey relationships through real-time graphs",
    prompt: "Simulate predator-prey dynamics"
  }
];

export default function UseCases() {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-6 text-gray-900">Built for Learners & Educators</h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {cases.map((case_, index) => (
            <motion.div
              key={case_.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-shadow"
            >
              <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <case_.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">{case_.title}</h3>
              <p className="text-gray-600 mb-4">{case_.description}</p>
              <div className="bg-gray-100 p-3 rounded-lg">
                <code className="text-blue-600">{case_.prompt}</code>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}