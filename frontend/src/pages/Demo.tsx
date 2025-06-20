import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, LogOut, Send, Loader2, BookOpen, Monitor, MessageSquare } from 'lucide-react';

interface SimulationResponse {
  canvasHtml: string;
  jsCode: string;
  explanation: string;
  usage?: {
    totalTokens: number;
  };
}

interface User {
  email: string;
  id: string;
}

export default function Demo(): JSX.Element {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState<string>('Physics');
  const [prompt, setPrompt] = useState<string>('Show how a pendulum behaves under the influence of gravity and explain the energy transformations during its swing');
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [simulationTitle, setSimulationTitle] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const buildIframeContent = (sim: SimulationResponse): string => `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>MindRender Simulation</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              html, body {
                height: 100vh;
                width: 100vw;
                overflow: hidden;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
              }
              canvas {
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                display: block !important;
                margin: 0 auto;
                max-width: calc(100vw - 40px);
                max-height: calc(100vh - 40px);
              }
              .status {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 500;
                z-index: 1000;
                opacity: 0.9;
              }
              .status.loading {
                background: #dbeafe;
                color: #1e40af;
              }
              .status.success {
                background: #d1fae5;
                color: #059669;
              }
              .status.error {
                background: #fee2e2;
                color: #dc2626;
              }
              .error-display {
                position: fixed;
                bottom: 10px;
                left: 10px;
                right: 10px;
                background: #fee2e2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 12px;
                font-family: monospace;
                font-size: 12px;
                color: #dc2626;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1001;
                white-space: pre-wrap;
                word-break: break-word;
              }
            </style>
          </head>
          <body>
            <div class="status loading" id="status">Loading...</div>
            ${sim.canvasHtml}
            <script>
              console.log('Iframe script starting...');

              const statusEl = document.getElementById('status');
              let canvas = null;
              let errorContainer = null;

              function showError(message, details = '') {
                console.error('Error:', message, details);
                if (!errorContainer) {
                  errorContainer = document.createElement('div');
                  errorContainer.className = 'error-display';
                  document.body.appendChild(errorContainer);
                }
                const timestamp = new Date().toLocaleTimeString();
                const errorText = timestamp + ' - ' + message + (details ? '\\n' + details : '');
                errorContainer.textContent = errorContainer.textContent + '\\n' + errorText;
                
                if (statusEl) {
                  statusEl.className = 'status error';
                  statusEl.textContent = 'Error occurred';
                }
              }

              window.onerror = function(message, source, lineno, colno, error) {
                const details = 'Line: ' + lineno + (colno ? ', Column: ' + colno : '') + 
                               (error && error.stack ? '\\nStack: ' + error.stack : '');
                showError('JavaScript Error: ' + message, details);
                return true;
              };

              window.addEventListener('unhandledrejection', function(event) {
                const reason = event.reason;
                const details = reason && reason.stack ? reason.stack : String(reason);
                showError('Promise Rejection: ' + (reason.message || reason), details);
              });

              setTimeout(() => {
                canvas = document.querySelector('canvas');
                if (canvas) {
                  console.log('Canvas found:', canvas.id, canvas.width + 'x' + canvas.height);
                  canvas.style.display = 'block';
                  canvas.style.margin = '0 auto';
                } else {
                  showError('No canvas element found in DOM');
                }
              }, 100);

              try {
                console.log('Executing simulation code...');
                ${sim.jsCode}

                console.log('Simulation code executed successfully');

                setTimeout(() => {
                  if (statusEl && !errorContainer) {
                    statusEl.className = 'status success';
                    statusEl.textContent = 'Active';
                    setTimeout(() => {
                      statusEl.style.opacity = '0.5';
                    }, 3000);
                  }
                }, 1500);

              } catch (error) {
                const details = error.stack || error.toString();
                showError('Execution Error: ' + error.message, details);
              }
            </script>
          </body>
          </html>`;

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      console.log('Loading content into iframe...');
      const content = buildIframeContent(simulationData);
      iframeRef.current.srcdoc = content;

      iframeRef.current.onload = () => {
        console.log('iframe loaded successfully');
      };

      iframeRef.current.onerror = (e) => {
        console.error('iframe loading error:', e);
      };
    }
  }, [simulationData]);

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

  const handleRunSimulation = async (inputPrompt?: string): Promise<void> => {
    const currentPrompt = inputPrompt || prompt;
    if (!currentPrompt.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting simulation request...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No valid session found. Please log in again.');
      }

      console.log('Sending request to edge function:', {
        prompt: currentPrompt.substring(0, 50) + '...',
        subject,
        timestamp: new Date().toISOString()
      });

      const requestBody = {
        prompt: currentPrompt.trim(),
        subject: subject
      };

      const response = await fetch(
        'https://zurfhydnztcxlomdyqds.supabase.co/functions/v1/simulate',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('Response received:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type')
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Simulation failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        console.error('Non-JSON response:', textResponse);
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }

      const data: SimulationResponse = await response.json();
      
      console.log('Parsed response data:', {
        hasCanvasHtml: !!data.canvasHtml,
        canvasLength: data.canvasHtml?.length || 0,
        hasJsCode: !!data.jsCode,
        jsLength: data.jsCode?.length || 0,
        hasExplanation: !!data.explanation,
        explanationLength: data.explanation?.length || 0,
        hasUsage: !!data.usage,
        totalTokens: data.usage?.totalTokens || 0,
        hasError: !!(data as any).error
      });

      if ((data as any).error) {
        throw new Error(`Simulation error: ${(data as any).error}`);
      }

      if (!data.canvasHtml || !data.jsCode) {
        console.error('Missing required fields:', data);
        throw new Error('Invalid response format from simulation service');
      }

      console.log('Setting simulation data...');
      setSimulationData(data);
      
      if (data.usage?.totalTokens) {
        setTokenUsage(prev => prev + data.usage.totalTokens);
      }

      const title = currentPrompt.length > 50 
        ? currentPrompt.substring(0, 47) + '...' 
        : currentPrompt;
      setSimulationTitle(title);

      if (inputPrompt) {
        setFollowUpPrompt('');
      }

    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'An error occurred while generating the simulation');
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
      iframeRef.current.srcdoc = '';
      iframeRef.current.src = 'about:blank';
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
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

      <div className="grid grid-cols-12 h-[calc(100vh-73px)]">
        
        <div className="col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-2 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
              <Monitor className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold">Controls</h2>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Subject Area
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors disabled:opacity-50"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">
                Simulation Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={loading}
                placeholder="Describe what you want to simulate..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white h-20 resize-none text-xs focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50"
              />
              <div className="text-xs text-gray-400 mt-1">
                {prompt.length}/500 characters
              </div>
            </div>

            <button
              onClick={() => handleRunSimulation()}
              disabled={loading || !prompt.trim()}
              className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>

            {simulationData && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-2 mb-2">
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
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-2 py-1.5 text-white text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleFollowUpSubmit()}
                  />
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={loading || !followUpPrompt.trim()}
                    className="bg-blue-500 text-white px-2 py-1.5 rounded-lg hover:bg-blue-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {simulationData && (
              <button
                onClick={handleNewSimulation}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-1.5 px-2 rounded-lg hover:bg-gray-500 transition-colors text-xs disabled:opacity-50"
              >
                New Simulation
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                <div className="flex items-start space-x-2">
                  <div className="text-red-400 mt-0.5 text-xs">Warning</div>
                  <div>
                    <div className="text-red-400 font-medium text-xs">Error</div>
                    <div className="text-red-300 text-xs mt-1 break-words">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-7 xl:col-span-7 bg-white border-r border-gray-300 flex flex-col h-full">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Simulation Viewer</h2>
                  {simulationTitle && (
                    <div className="text-sm text-gray-600 mt-0.5">
                      {subject}: {simulationTitle}
                    </div>
                  )}
                </div>
              </div>
              {simulationData && (
                <div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 relative overflow-hidden bg-gray-50">
            {loading ? (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Generating simulation...
                  </h3>
                  <p className="text-gray-600">
                    Creating your interactive visualization. This may take a moment.
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
                scrolling="no"
                style={{ 
                  overflow: 'hidden',
                  border: 'none',
                  width: '100%',
                  height: '100%'
                }}
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

        <div className="col-span-12 md:col-span-3 lg:col-span-3 xl:col-span-3 bg-gray-50 flex flex-col h-full">
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-800">Explanation</h2>
              {simulationData?.explanation && (
                <div className="ml-auto">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Ready
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" style={{ scrollbarWidth: 'thin' }}>
            {simulationData?.explanation ? (
              <div className="prose prose-sm max-w-none">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div 
                    className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap break-words hyphens-auto"
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: simulationData.explanation.replace(/\n/g, '<br/>') 
                    }}
                  />
                </div>
              </div>
            ) : simulationData && !simulationData.explanation ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-yellow-800 text-sm">
                  <div className="font-medium mb-1">No explanation generated</div>
                  <div>Try modifying your prompt to get a more detailed explanation of the simulation.</div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-center">
                <div className="max-w-sm">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">
                    Explanation Ready
                  </h3>
                  <p className="text-gray-500">
                    Run a simulation to see a concise explanation of the concepts and mechanics involved.
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