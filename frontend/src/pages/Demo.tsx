import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { Play, LogOut, Send, Loader2, BookOpen, Monitor, MessageSquare, AlertTriangle, Menu, X, Sparkles } from 'lucide-react';

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

const TOKEN_LIMIT = 2000;

// Generate context-aware follow-up questions based on the simulation
const generateFollowUpQuestions = (prompt: string, subject: string): string[] => {
  const baseQuestions = [
    "Can you explain this in simpler terms?",
    "What are the real-world applications?",
    "How does this compare to other methods?",
    "What would happen if we changed the parameters?"
  ];

  // Subject-specific questions
  const subjectQuestions: Record<string, string[]> = {
    Physics: [
      "What forces are acting in this simulation?",
      "How would this change in a vacuum?",
      "What's the mathematical equation behind this?",
      "How does friction affect the outcome?"
    ],
    Mathematics: [
      "Can you show the step-by-step calculation?",
      "What's the geometric interpretation?",
      "How does this relate to other mathematical concepts?",
      "What happens at the boundary conditions?"
    ],
    Chemistry: [
      "What chemical bonds are involved?",
      "How does temperature affect this reaction?",
      "What are the molecular interactions?",
      "What catalysts could speed this up?"
    ],
    Biology: [
      "What cellular processes are involved?",
      "How does this relate to evolution?",
      "What environmental factors affect this?",
      "How does this vary across species?"
    ]
  };

  // Combine base questions with subject-specific ones
  const allQuestions = [...baseQuestions, ...(subjectQuestions[subject] || [])];
  
  // Select 3-4 random questions
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 3); // 3-4 questions
};

export default function Demo(): JSX.Element {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState<string>('Physics');
  const [prompt, setPrompt] = useState<string>('Show how a pendulum behaves under the influence of gravity and explain the energy transformations during its swing');
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isTokenLimitReached = tokenUsage >= TOKEN_LIMIT;
  const tokensRemaining = Math.max(0, TOKEN_LIMIT - tokenUsage);

  useEffect(() => {
    if (simulationData && iframeRef.current) {
      const injectSimulationContent = () => {
        const combinedContent = `
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
                max-width: calc(100vw - 20px);
                max-height: calc(100vh - 20px);
              }
              .status {
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
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
                color: #dc2626;
                padding: 8px;
                border-radius: 4px;
                font-size: 12px;
                z-index: 1000;
                max-height: 100px;
                overflow-y: auto;
                white-space: pre-wrap;
                font-family: monospace;
              }
            </style>
          </head>
          <body>
            <div class="status loading" id="status">Loading...</div>
            ${simulationData.canvasHtml}
            <script>
              (function() {
                'use strict';
                
                console.log('Iframe script starting...');
                
                var statusEl = document.getElementById('status');
                var errorCount = 0;
                var maxErrors = 5;
                
                function showError(message) {
                  errorCount++;
                  console.error('Simulation Error #' + errorCount + ':', message);
                  
                  var errorDiv = document.querySelector('.error-display');
                  if (!errorDiv) {
                    errorDiv = document.createElement('div');
                    errorDiv.className = 'error-display';
                    document.body.appendChild(errorDiv);
                  }
                  
                  var errorText = 'Error #' + errorCount + ': ' + message;
                  if (errorCount > 1) {
                    errorDiv.textContent = errorDiv.textContent + '\\n' + errorText;
                  } else {
                    errorDiv.textContent = errorText;
                  }
                  
                  if (statusEl) {
                    statusEl.className = 'status error';
                    statusEl.textContent = 'Error (' + errorCount + ')';
                  }
                  
                  if (errorCount >= maxErrors) {
                    console.error('Maximum error count reached, stopping execution');
                    return false;
                  }
                  return true;
                }
                
                window.onerror = function(message, source, lineno, colno, error) {
                  var errorMsg = 'JS Error: ' + message;
                  if (lineno) errorMsg += ' (Line: ' + lineno + ')';
                  return showError(errorMsg);
                };
                
                window.addEventListener('unhandledrejection', function(event) {
                  showError('Promise Error: ' + (event.reason || 'Unknown promise rejection'));
                });
                
                function waitForCanvas(callback, maxAttempts) {
                  maxAttempts = maxAttempts || 100;
                  var attempts = 0;
                  
                  function checkCanvas() {
                    attempts++;
                    var canvasElement = document.querySelector('canvas');
                    
                    if (canvasElement) {
                      console.log('Canvas found after', attempts, 'attempts');
                      console.log('Canvas details:', {
                        id: canvasElement.id || 'no-id',
                        width: canvasElement.width,
                        height: canvasElement.height,
                        tagName: canvasElement.tagName
                      });
                      
                      canvasElement.style.display = 'block';
                      canvasElement.style.margin = '0 auto';
                      
                      try {
                        callback(canvasElement);
                      } catch (callbackError) {
                        showError('Callback execution error: ' + callbackError.message);
                      }
                    } else if (attempts < maxAttempts) {
                      setTimeout(checkCanvas, 25);
                    } else {
                      showError('Canvas element not found after ' + maxAttempts + ' attempts. HTML content: ' + document.body.innerHTML.substring(0, 200));
                    }
                  }
                  
                  checkCanvas();
                }
                
                function executeSimulationCode(canvasElement) {
                  try {
                    console.log('Executing simulation code with canvas:', canvasElement);
                    
                    var simulationFunction = new Function('canvas', \`
                      try {
                        ${simulationData.jsCode.replace(/`/g, '\\`').replace(/\$/g, '\\$')}
                      } catch (execError) {
                        throw new Error('Simulation execution failed: ' + execError.message);
                      }
                    \`);
                    
                    simulationFunction(canvasElement);
                    
                    console.log('Simulation code executed successfully');
                    
                    if (statusEl) {
                      statusEl.className = 'status success';
                      statusEl.textContent = 'Active';
                      setTimeout(function() {
                        statusEl.style.opacity = '0.5';
                      }, 3000);
                    }
                    
                  } catch (error) {
                    showError('Code execution error: ' + error.message);
                  }
                }
                
                function initializeSimulation() {
                  try {
                    console.log('Starting simulation initialization...');
                    
                    if (statusEl) {
                      statusEl.className = 'status loading';
                      statusEl.textContent = 'Initializing...';
                    }
                    
                    waitForCanvas(function(canvasElement) {
                      if (statusEl) {
                        statusEl.textContent = 'Executing...';
                      }
                      
                      setTimeout(function() {
                        executeSimulationCode(canvasElement);
                      }, 50);
                    }, 100);
                    
                  } catch (error) {
                    showError('Initialization error: ' + error.message);
                  }
                }
                
                function startWhenReady() {
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      setTimeout(initializeSimulation, 200);
                    });
                  } else if (document.readyState === 'interactive') {
                    setTimeout(initializeSimulation, 100);
                  } else {
                    setTimeout(initializeSimulation, 50);
                  }
                }
                
                startWhenReady();
                
              })();
            </script>
          </body>
          </html>
        `;
        
        console.log('Injecting content into iframe...');
        iframeRef.current!.srcdoc = combinedContent;
        
        iframeRef.current!.onload = () => {
          console.log('iframe loaded successfully');
        };
        
        iframeRef.current!.onerror = (e) => {
          console.error('iframe loading error:', e);
        };
      };

      setTimeout(injectSimulationContent, 100);
    }
  }, [simulationData]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 animate-spin" />
          <div className="text-white text-base sm:text-lg text-center">Loading authentication...</div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 sm:p-8 max-w-md mx-4">
          <div className="text-red-400 text-center">
            <div className="text-lg sm:text-xl font-semibold mb-2">Authentication Error</div>
            <div className="text-sm mb-4">{authError}</div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors text-sm"
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center bg-gray-800 rounded-xl p-6 sm:p-8 max-w-md mx-4">
          <div className="text-white text-lg sm:text-xl font-semibold mb-4">Access Required</div>
          <div className="text-gray-300 mb-6 text-sm sm:text-base">Please log in to access the MindRender demo</div>
          <a 
            href="/auth" 
            className="inline-flex items-center bg-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium text-sm sm:text-base"
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
    
    if (isTokenLimitReached) {
      setError(`Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setMobileMenuOpen(false);
    
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
      iframeRef.current.src = 'about:blank';
    }
    
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
        tokensUsed: data.usage?.totalTokens || 0,
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
      
      // Generate follow-up questions based on the current prompt and subject
      const questions = generateFollowUpQuestions(currentPrompt, subject);
      setFollowUpQuestions(questions);
      
      if (data.usage?.totalTokens) {
        const newTokenUsage = tokenUsage + data.usage.totalTokens;
        setTokenUsage(newTokenUsage);
        console.log('Tokens used this request:', data.usage.totalTokens);
        console.log('Total tokens used:', newTokenUsage);
        
        if (newTokenUsage >= TOKEN_LIMIT) {
          setError(`Token limit reached (${newTokenUsage}/${TOKEN_LIMIT}). This was your last simulation.`);
        }
      } else {
        setTokenUsage(prev => prev + 1);
      }

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
    if (isTokenLimitReached) {
      setError(`Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`);
      return;
    }
    await handleRunSimulation(followUpPrompt);
  };

  const handleFollowUpQuestionClick = async (question: string): Promise<void> => {
    if (isTokenLimitReached) {
      setError(`Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`);
      return;
    }
    await handleRunSimulation(question);
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
    setFollowUpQuestions([]);
    setPrompt('');
    setFollowUpPrompt('');
    setError(null);
    setMobileMenuOpen(false);
    if (iframeRef.current) {
      iframeRef.current.srcdoc = '';
      iframeRef.current.src = 'about:blank';
    }
  };

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
      <div className="border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm flex-shrink-0">
        <div className="flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <h1 className="text-lg sm:text-2xl font-bold text-white">MindRender</h1>
            <div className="hidden md:block w-px h-6 bg-gray-600"></div>
            <div className="hidden md:block text-sm text-gray-400">
              Interactive Learning Simulations
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm ${
              isTokenLimitReached 
                ? 'bg-red-500/20 border border-red-500/30' 
                : tokenUsage > TOKEN_LIMIT * 0.8
                  ? 'bg-yellow-500/20 border border-yellow-500/30'
                  : 'bg-gray-700/50'
            }`}>
              <span className="text-gray-300">
                <span className="hidden sm:inline">Tokens: </span>
                <span className={`font-medium ${
                  isTokenLimitReached 
                    ? 'text-red-400' 
                    : tokenUsage > TOKEN_LIMIT * 0.8
                      ? 'text-yellow-400'
                      : 'text-yellow-400'
                }`}>{tokenUsage}</span>
                <span className="hidden sm:inline"> / {TOKEN_LIMIT}</span>
              </span>
            </div>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden bg-gray-700 text-white p-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
            
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-sm text-gray-300 hidden lg:block truncate max-w-32">{user.email}</div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 bg-gray-800 p-4">
            <div className="flex flex-col space-y-3">
              <div className="text-sm text-gray-300 truncate">{user.email}</div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-400 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="md:hidden flex flex-col h-full">
          <div className="bg-gray-800 border-b border-gray-700 p-4 space-y-4">
            <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
              <Monitor className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-semibold">Controls</h2>
            </div>

            {isTokenLimitReached && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <div className="text-red-400 font-medium text-sm">Token Limit Reached</div>
                </div>
                <div className="text-red-300 text-xs">
                  You have used {tokenUsage} out of {TOKEN_LIMIT} tokens.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Subject Area
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isTokenLimitReached}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-2">
                Simulation Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to simulate..."
                disabled={isTokenLimitReached}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-20 resize-none text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {simulationData && followUpQuestions.length > 0 && !isTokenLimitReached && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center space-x-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-medium text-gray-300">
                    Follow Up Questions
                  </label>
                </div>
                <div className="space-y-2">
                  {followUpQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleFollowUpQuestionClick(question)}
                      disabled={loading || isTokenLimitReached}
                      className="w-full text-left bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => handleRunSimulation()}
              disabled={loading || !prompt.trim() || isTokenLimitReached}
              className="w-full bg-yellow-500 text-black py-2 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm disabled:bg-gray-600 disabled:text-gray-400"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : isTokenLimitReached ? (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Token Limit Reached</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Run Simulation</span>
                </>
              )}
            </button>

            {simulationData && !isTokenLimitReached && (
              <div className="pt-2 border-t border-gray-700">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={followUpPrompt}
                    onChange={(e) => setFollowUpPrompt(e.target.value)}
                    placeholder="Ask more..."
                    disabled={isTokenLimitReached || loading}
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onKeyPress={(e) => e.key === 'Enter' && !loading && handleFollowUpSubmit()}
                  />
                  <button
                    onClick={handleFollowUpSubmit}
                    disabled={loading || !followUpPrompt.trim() || isTokenLimitReached}
                    className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {simulationData && (
              <button
                onClick={handleNewSimulation}
                className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors text-sm"
              >
                New Simulation
              </button>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-red-400 font-medium text-sm">Error</div>
                    <div className="text-red-300 text-sm mt-1 break-words">{error}</div>
                    <button
                      onClick={() => setError(null)}
                      className="text-red-400 hover:text-red-300 text-sm mt-1 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 bg-white flex flex-col">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4 text-gray-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Simulation</h2>
                </div>
                {simulationData && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gray-50">
              {loading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
                    <div className="text-gray-700 font-medium">Generating simulation...</div>
                  </div>
                </div>
              )}
              
              {simulationData ? (
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
                <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Ready to Simulate
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {isTokenLimitReached 
                        ? `Token limit reached. Contact support to continue.`
                        : "Enter a prompt above and click 'Run Simulation' to see it come to life."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {simulationData?.explanation && (
            <div className="bg-gray-50 border-t border-gray-200 max-h-48 overflow-y-auto">
              <div className="bg-white border-b border-gray-200 px-4 py-2 sticky top-0">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Explanation</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                  <div 
                    className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap break-words"
                    style={{
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      lineHeight: '1.6'
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: (simulationData.explanation || "No explanation was generated. Try modifying your prompt.").replace(/\n/g, '<br/>') 
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:grid md:grid-cols-12 h-full">
          <div className="md:col-span-3 lg:col-span-2 xl:col-span-2 bg-gray-800 border-r border-gray-700 flex flex-col h-full">
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="flex items-center space-x-2 pb-3 border-b border-gray-700">
                <Monitor className="w-5 h-5 text-yellow-500" />
                <h2 className="text-sm font-semibold">Controls</h2>
              </div>

              {isTokenLimitReached && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div className="text-red-400 font-medium text-sm">Token Limit Reached</div>
                  </div>
                  <div className="text-red-300 text-xs">
                    You have used {tokenUsage} out of {TOKEN_LIMIT} tokens. Contact support to increase your limit.
                  </div>
                </div>
              )}

              {!isTokenLimitReached && tokenUsage > TOKEN_LIMIT * 0.8 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <div className="text-yellow-400 font-medium text-sm">Token Limit Warning</div>
                  </div>
                  <div className="text-yellow-300 text-xs">
                    {tokensRemaining} tokens remaining. Use wisely.
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject Area
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={isTokenLimitReached}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Simulation Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to simulate..."
                  disabled={isTokenLimitReached}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white h-28 resize-none text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {prompt.length}/500 characters
                </div>
              </div>

              {simulationData && followUpQuestions.length > 0 && !isTokenLimitReached && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <label className="text-sm font-medium text-gray-300">
                      Follow Up Questions
                    </label>
                  </div>
                  <div className="space-y-2">
                    {followUpQuestions.map((question, index) => (
                      <button
                        key={index}
                        onClick={() => handleFollowUpQuestionClick(question)}
                        disabled={loading || isTokenLimitReached}
                        className="w-full text-left bg-blue-500/10 border border-blue-500/20 text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-500/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => handleRunSimulation()}
                disabled={loading || !prompt.trim() || isTokenLimitReached}
                className="w-full bg-yellow-500 text-black py-3 rounded-lg hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm disabled:bg-gray-600 disabled:text-gray-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : isTokenLimitReached ? (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Token Limit Reached</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Simulation</span>
                  </>
                )}
              </button>

              {simulationData && !isTokenLimitReached && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <label className="text-sm font-medium text-gray-300">
                      Follow-up
                    </label>
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={followUpPrompt}
                      onChange={(e) => setFollowUpPrompt(e.target.value)}
                      placeholder="Ask more..."
                      disabled={isTokenLimitReached || loading}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      onKeyPress={(e) => e.key === 'Enter' && !loading && handleFollowUpSubmit()}
                    />
                    <button
                      onClick={handleFollowUpSubmit}
                      disabled={loading || !followUpPrompt.trim() || isTokenLimitReached}
                      className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-400 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {simulationData && (
                <button
                  onClick={handleNewSimulation}
                  className="w-full bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-500 transition-colors text-sm"
                >
                  New Simulation
                </button>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-red-400 mt-0.5 text-sm">Warning</div>
                    <div>
                      <div className="text-red-400 font-medium text-sm">Error</div>
                      <div className="text-red-300 text-sm mt-1 break-words">{error}</div>
                      <button
                        onClick={() => setError(null)}
                        className="text-red-400 hover:text-red-300 text-sm mt-1 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-7 xl:col-span-7 bg-white border-r border-gray-300 flex flex-col h-full">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  Simulation Viewer
                  {simulationData && (
                    <span className="ml-2 text-sm font-normal text-gray-600">
                      {subject}
                    </span>
                  )}
                </h2>
                {simulationData && (
                  <div className="ml-auto">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-gray-50">
              {loading && (
                <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <div className="text-gray-700 text-lg font-medium">Generating simulation...</div>
                  </div>
                </div>
              )}
              
              {simulationData ? (
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
                      {isTokenLimitReached 
                        ? `Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Contact support to continue.`
                        : "Enter a prompt describing what you'd like to learn about, then click 'Run Simulation' to see it come to life."
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-3 lg:col-span-3 xl:col-span-3 bg-gray-50 flex flex-col h-full">
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
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" style={{ lineHeight: '1.6' }}>
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
                        __html: (simulationData.explanation || "No explanation was generated. Try modifying your prompt.").replace(/\n/g, '<br/>') 
                      }}
                    />
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
    </div>
  );
}