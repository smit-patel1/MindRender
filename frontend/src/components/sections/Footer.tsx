import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

const quickLinks = [
  { name: "Home", to: "/" },
  { name: "Learn More", to: "/learn" },
  { name: "Try Demo", to: "/demo" }
];

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div>
            <h3 className="text-2xl font-bold mb-4">MindRender</h3>
            <p className="text-gray-400">Transform your ideas into interactive simulations.</p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.name}>
                  <Link to={link.to} className="text-gray-400 hover:text-white transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">GitHub</h4>
            <a
              href="https://github.com/smit-patel1/MindRender"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
            >
              <Github className="w-6 h-6" />
              <span className="ml-2">View Source</span>
            </a>
          </div>
        </div>
        
        {/* Built with Bolt Badge */}
        <div className="mt-8 pt-8 border-t border-gray-700 text-center">
          <a
            href="https://bolt.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block hover:opacity-80 transition-opacity"
          >
            <img
              src="/black_circle_360x360.png"
              alt="Built with Bolt"
              className="w-16 h-16 mx-auto"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}