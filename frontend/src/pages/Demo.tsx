import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, LogOut, Send, Loader2, BookOpen, Monitor, MessageSquare } from 'lucide-react';

interface SimulationResponse {
  canvasHtml: string;
  jsCode: string;
  explanation: string;
}

interface User {
  email: string;
  id: string;
}

export default function Demo(): JSX.Element {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState<string>('Mathematics');
  const [prompt, setPrompt] = useState<string>('');
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [simulationTitle, setSimulationTitle] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-yellow-500 animate-spin" />
          <div className="text-white text-lg">Loading authentication...</div>
        </div>
      </div>
    );
  }

  // Show auth error
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <div className="text-xl font-semibold mb-2">Authentication Error</div>
            <div className="text-sm mb-4">{authError}</div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 rounded-xl p-8 max-w-md mx-4">
          <div className="text-white text-xl font-semibold mb-4">Access Required</div>
          <div className="text-gray-300 mb-6">Please log in to access the MindRender demo</div>
          <a 
            href="/auth" 
            className="inline-flex items-center bg-yellow-500 text-black px-6 py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  const generateSimulationTitle = (prompt: string): string => {
    const words = prompt.trim().split(' ').slice(0, 4);
    return words.map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleRunSimulation = async (inputPrompt?: string): Promise<void> => {
    const currentPrompt = inputPrompt || prompt;
    if (!currentPrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Sending request to Supabase Edge Function...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session found. Please log in again.');
      }

      const response = await fetch(
        'https://zurfhydnztcxlomdyqds.supabase.co/functions/v1/simulate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            prompt: currentPrompt.trim(),
            subject: subject
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Simulation failed: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data: SimulationResponse = await response.json();
      
      if (!data.canvasHtml || !data.jsCode) {
        throw new Error('Invalid response format from simulation service');
      }

      console.log('Simulation generated successfully');
      setSimulationData(data);
      setTokenUsage(prev => prev + 1);
      setSimulationTitle(generateSimulationTitle(currentPrompt));

      // Inject the simulation into the iframe with error handling
      if (iframeRef.current) {
        const combinedContent = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MindRender Simulation</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
              }
              .error-display {
                background: #fee2e2;
                border: 1px solid #fecaca;
                color: #dc2626;
                padding: 12px;
                border-radius: 6px;
                margin: 10px 0;
                font-family: monospace;
                font-size: 12px;
                white-space: pre-wrap;
              }
            </style>
          </head>
          <body>
            ${data.canvasHtml}
            <script>
              window.onerror = function(message, source, lineno, colno, error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-display';
                errorDiv.textContent = 'JavaScript Error: ' + message + '\\nLine: ' + lineno + (error ? '\\nStack: ' + error.stack : '');
                document.body.appendChild(errorDiv);
                return true;
              };
              
              window.addEventListener('unhandledrejection', function(event) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-display';
                errorDiv.textContent = 'Promise Rejection: ' + event.reason;
                document.body.appendChild(errorDiv);
              });
              
              try {
                ${data.jsCode}
              } catch (error) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-display';
                errorDiv.textContent = 'Execution Error: ' + error.message + '\\nStack: ' + error.stack;
                document.body.appendChild(errorDiv);
              }
            </script>
          </body>
          </html>
        `;
        iframeRef.current.src = `data:text/html;charset=utf-8,${encodeURIComponent(combinedContent)}`;
      }

      // Clear follow-up prompt if it was used
      if (inputPrompt) {
        setFollowUpPrompt('');
      }

    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSubmit = async (): Promise<void> => {
    if (!followUpPrompt.trim()) return;
    await handleRunSimulation(followUpPrompt);
  };

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const handleNewSimulation = (): void => {
    setSimulationData(null);
    setPrompt('');
    setFollowUpPrompt('');
    setError(null);
    setSimulationTitle('');
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex justify-between items-center px-6 py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">MindRender Demo</h1>
            <div className="hidden sm:block w-px h-6 bg-gray-600"></div>
            <div className="hidden sm:block text-sm text-gray-400">
              Interactive Learning Simulations
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="bg-gray-700/50 rounded-lg px-3 py-1">
              <span className="text-sm text-gray-300">
                Tokens: <span className="text-yellow-400 font-medium">{tokenUsage}</span> / 2000
              </span>
            </div>
            <div className="text-sm text-gray-300 hidden lg:block">{user.email}</div>
            <button
              onClick={handleSignOut}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout - Fixed 12-column grid */}
      <div className="grid grid-cols-12 h-[calc(100vh-73px)]">
        
        {/* Left Panel - Simulation Controls */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            {/* Panel Header */}
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
              <Monitor className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold">Controls</h2>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-white text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            {/* Simulation Prompt */}
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                placeholder="Describe what you want to simulate..."
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-white h-20 resize-none text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50"
              />
              <div className="text-xs text-gray-400 mt-1">
                {prompt.length}/500
              </div>
            </div>

            {/* Run Simulation Button */}
            <button
              onClick={() => handleRunSimulation()}
              disabled={loading || !prompt.trim()}
              className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Run</span>
                </>
              )}
            </button>

            {/* Follow-up Question Input */}
            {simulationData && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-1 mb-1">
                  <MessageSquare className="w-3 h-3 text-blue-400" />
                  <label className="text-xs font-medium text-gray-300">
                    Follow-up
                  </label>
                </div>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    disabled={loading}
                    placeholder="Ask more..."
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1.5 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleFollowUpSubmit()}
                  />
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={loading || !followUpPrompt.trim()}
                    className="bg-blue-500 text-white px-2 py-1.5 rounded-md hover:bg-blue-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* New Simulation Button */}
            {simulationData && (
              <button
                onClick={handleNewSimulation}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-1.5 px-2 rounded-md hover:bg-gray-500 transition-colors text-xs disabled:opacity-50"
              >
                New Simulation
              </button>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2">
                <div className="flex items-start space-x-1">
                  <div className="text-red-400 mt-0.5 text-xs">⚠️</div>
                  <div>
                    <div className="text-red-400 font-medium text-xs">Error</div>
                    <div className="text-red-300 text-xs mt-0.5">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 text-xs mt-0.5 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel - Simulation Viewer */}
        <div className="col-span-12 md:col-span-6 lg:col-span-7 xl:col-span-7 bg-white border-r border-gray-300 flex flex-col">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">Simulation Viewer</h2>
              </div>
              {simulationTitle && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span className="font-medium">{subject}</span>
                  <span>•</span>
                  <span>{simulationTitle}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Generating simulation...
                  </h3>
                  <p className="text-gray-600">
                    Please wait while we create your interactive visualization
                  </p>
                </div>
              </div>
            ) : simulationData ? (
              <iframe
                ref={iframeRef}
                id="simulation-iframe"
                className="w-full h-full border-0"
                title="Interactive Simulation"
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    Ready to Simulate
                  </h3>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Enter a prompt describing what you'd like to learn about, then click "Run Simulation" to see it come to life.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Explanation Area */}
        <div className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 bg-gray-50 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Explanation</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
            {simulationData?.explanation ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div 
                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                    style={{ lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ 
                      __html: simulationData.explanation.replace(/\n/g, '<br/>') 
                    }}
                  />
                </div>
              </div>
            ) : simulationData && (!simulationData.explanation || simulationData.explanation.trim() === '') ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800">
                  <h3 className="font-medium mb-2">No Explanation Generated</h3>
                  <p className="text-sm">
                    No explanation was generated for this simulation. Try modifying your prompt to be more specific about what you'd like to understand.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-sm">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Explanation Ready
                  </h3>
                  <p className="text-gray-500" style={{ lineHeight: '1.6' }}>
                    Run a simulation to see a detailed explanation of the concepts and mechanics involved.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}