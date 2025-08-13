import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthProvider';
import { supabase } from '../lib/supabaseClient';
import { TOKEN_LIMIT } from '../constants';
import { Play, LogOut, Send, Loader2, BookOpen, Monitor, MessageSquare, AlertTriangle, Menu, X, ShieldAlert, Cpu, Atom, Dna } from 'lucide-react';
import DemoNavbar from '../components/DemoNavbar';

interface SimulationResponse {
  canvasHtml: string;
  jsCode: string;
  explanation: string;
  usage?: {
    totalTokens: number;
  };
  contentWarning?: boolean;
  warningMessage?: string;
}

interface User {
  email: string | undefined;
  id: string;
  user_metadata?: { role?: string };
}

const SUBJECTS = ['Physics', 'Biology', 'Computer Science'] as const;
type SubjectType = typeof SUBJECTS[number];

const SUBJECT_INFO: Record<SubjectType, {
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  examples: string[];
}> = {
  'Physics': {
    icon: Atom,
    description: 'Interactive physics simulations with real-time controls',
    examples: ['pendulum motion', 'wave interference', 'electromagnetic fields', 'thermodynamics']
  },
  'Biology': {
    icon: Dna,
    description: 'Dynamic biological process visualizations',
    examples: ['cell division', 'photosynthesis', 'genetic inheritance', 'ecosystem dynamics']
  },
  'Computer Science': {
    icon: Cpu,
    description: 'Algorithm and data structure visualizations',
    examples: ['sorting algorithms', 'binary trees', 'pathfinding', 'recursive functions']
  }
};

const validatePromptClient = (prompt: string, subject: string): { isValid: boolean; reason?: string } => {
  const STRICTLY_BLOCKED_KEYWORDS = [
    'kiss', 'kissing', 'sexual', 'nude', 'naked', 'porn', 'sex', 'erotic', 'intimate', 'romance', 'dating',
    'kill', 'murder', 'blood', 'death',
    'hate', 'racist', 'terrorist', 'drug', 'alcohol', 'suicide'
  ];

  const UNAVAILABLE_SUBJECTS = ['mathematics', 'chemistry', 'math', 'chem'];

  const lowerPrompt = prompt.toLowerCase();
  
  const unavailableSubject = UNAVAILABLE_SUBJECTS.find(subj => 
    lowerPrompt.includes(subj) && !lowerPrompt.includes(subject.toLowerCase())
  );
  
  if (unavailableSubject) {
    return { 
      isValid: false, 
      reason: `${unavailableSubject.charAt(0).toUpperCase() + unavailableSubject.slice(1)} simulations will be available in future updates. Currently available: Physics, Biology, and Computer Science.`
    };
  }
  
  const blockedWord = STRICTLY_BLOCKED_KEYWORDS.find(keyword => 
    lowerPrompt.includes(keyword.toLowerCase())
  );
  
  if (blockedWord) {
    return { 
      isValid: false, 
      reason: `Content not suitable for educational platform. Please focus on academic ${subject} topics.`
    };
  }
  
  if (prompt.trim().length < 15) {
    return { 
      isValid: false, 
      reason: `Please provide a more detailed educational prompt (minimum 15 characters).`
    };
  }
  
  return { isValid: true };
};

const ErrorBoundary: React.FC<{ children: React.ReactNode; fallback: React.ReactNode }> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

const LoadingSpinner = React.memo(({ size = 'default', text }: { size?: 'small' | 'default' | 'large'; text?: string }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
      {text && <div className="text-gray-700 font-medium text-sm">{text}</div>}
    </div>
  );
});

const FormattedExplanation = React.memo(({ explanation }: { explanation: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { truncatedContent, fullContent, needsTruncation } = useMemo(() => {
    if (!explanation) return { truncatedContent: '', fullContent: '', needsTruncation: false };
    
    const formatContent = (text: string) => {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<h3 class="explanation-heading">$1</h3>')
        .replace(/^- (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .replace(/^\* (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .replace(/^• (.*$)/gim, '<li class="explanation-bullet">$1</li>')
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('<h3') || trimmed.startsWith('<li')) return trimmed;
          if (trimmed) return `<p class="explanation-text">${trimmed}</p>`;
          return '';
        })
        .filter(Boolean)
        .join('');
    };

    const words = explanation.split(' ');
    const wordLimit = 60;
    const needsTruncation = words.length > wordLimit;

    const truncatedText = needsTruncation ? words.slice(0, wordLimit).join(' ') + '...' : explanation;

    return {
      truncatedContent: DOMPurify.sanitize(formatContent(truncatedText)),
      fullContent: DOMPurify.sanitize(formatContent(explanation)),
      needsTruncation
    };
  }, [explanation]);

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      <style>{`
        .explanation-heading {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin: 8px 0 3px 0;
          padding-bottom: 2px;
          border-bottom: 2px solid #3b82f6;
          display: inline-block;
          line-height: 1.2;
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .explanation-heading:first-child {
          margin-top: 0;
        }
        .explanation-bullet {
          list-style: none;
          position: relative;
          padding-left: 14px;
          margin: 2px 0;
          line-height: 1.3;
          color: #374151;
          font-size: 14px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
        .explanation-bullet:before {
          content: "•";
          color: #3b82f6;
          font-weight: bold;
          position: absolute;
          left: 0;
          font-size: 12px;
        }
        .explanation-text {
          margin: 3px 0;
          line-height: 1.3;
          color: #4b5563;
          font-size: 14px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          hyphens: auto;
        }
      `}</style>
      
      <div 
        className="explanation-content"
        dangerouslySetInnerHTML={{ 
          __html: isExpanded ? fullContent : truncatedContent 
        }} 
      />
      
      {needsTruncation && (
        <div className="mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 text-xs font-medium underline focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50 rounded"
          >
            {isExpanded ? 'Show Less' : 'Read More'}
          </button>
        </div>
      )}
    </div>
  );
});

const ContentWarningDisplay = React.memo(({ warningMessage, onDismiss }: { warningMessage: string; onDismiss: () => void }) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
      <div className="flex items-start space-x-2">
        <ShieldAlert className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-xs font-semibold text-yellow-900 mb-1">Content Notice</h4>
          <p className="text-xs text-yellow-700 mb-2">{warningMessage}</p>
          <button
            onClick={onDismiss}
            className="text-xs bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
});

const SubjectSelector = React.memo(({ subject, onChange, disabled }: { subject: SubjectType; onChange: (value: SubjectType) => void; disabled: boolean }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Subject Area
      </label>
      <select
        value={subject}
        onChange={(e) => onChange(e.target.value as SubjectType)}
        disabled={disabled}
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-white text-sm focus:ring-1 focus:ring-yellow-500 focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {SUBJECTS.map((subj) => (
          <option key={subj} value={subj}>{subj}</option>
        ))}
      </select>
      
      <div className="mt-2 p-2 bg-gray-600/30 rounded-md">
        <div className="flex items-center space-x-2 mb-1">
          {React.createElement(SUBJECT_INFO[subject].icon, { className: "w-4 h-4 text-yellow-400" })}
          <span className="text-xs font-medium text-gray-300">{subject}</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">{SUBJECT_INFO[subject].description}</p>
        <div className="text-xs text-gray-500">
          <strong>Try:</strong> {SUBJECT_INFO[subject].examples.join(', ')}
        </div>
      </div>
    </div>
  );
});

const SimulationIframe = React.memo(({ simulationData }: { simulationData: SimulationResponse }) => {
  const iframeContent = useMemo(() => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none';">
      <title>MindRender Simulation</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: 100%;
          width: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        canvas {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          display: block !important;
          margin: 0 auto;
          max-width: 100%;
          max-height: 100%;
          cursor: pointer;
        }
        
        .status {
          position: fixed;
          top: 15px;
          right: 15px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          z-index: 1000;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          opacity: 0.9;
        }
        .status.loading {
          background: rgba(59, 130, 246, 0.15);
          color: #1e40af;
          border-color: rgba(59, 130, 246, 0.4);
        }
        .status.success {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.4);
        }
        .status.error {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .status.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
          border-color: rgba(245, 158, 11, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="status ${simulationData.contentWarning ? 'warning' : 'loading'}" id="status">${simulationData.contentWarning ? 'Content Notice' : 'Initializing...'}</div>
      
      ${simulationData.canvasHtml}
      
      <script>
        const statusEl = document.getElementById('status');
        
        function resizeCanvas() {
          const canvas = document.querySelector('canvas');
          if (!canvas) return;
          
          const originalWidth = canvas.width || 800;
          const originalHeight = canvas.height || 600;
          const aspectRatio = originalWidth / originalHeight;
          
          const availableWidth = window.innerWidth * 0.92;
          const availableHeight = window.innerHeight * 0.92;
          
          let newWidth, newHeight;
          
          if (availableWidth / aspectRatio <= availableHeight) {
            newWidth = availableWidth;
            newHeight = availableWidth / aspectRatio;
          } else {
            newHeight = availableHeight;
            newWidth = availableHeight * aspectRatio;
          }
          
          newWidth = Math.max(newWidth, 400);
          newHeight = Math.max(newHeight, 300);
          
          canvas.width = Math.floor(newWidth);
          canvas.height = Math.floor(newHeight);
          
          canvas.style.width = Math.floor(newWidth) + 'px';
          canvas.style.height = Math.floor(newHeight) + 'px';
          
          console.log('Canvas resized to:', Math.floor(newWidth) + 'x' + Math.floor(newHeight));
        }
        
        window.onerror = function(message, source, lineno, colno, error) {
          console.error('Simulation Error:', message, 'Line:', lineno);
          if (statusEl) {
            statusEl.className = 'status error';
            statusEl.textContent = 'Script Error';
          }
          return true;
        };
        
        setTimeout(() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            console.log('Canvas found, original size:', canvas.width + 'x' + canvas.height);
            
            resizeCanvas();
            
            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
            canvas.style.cursor = 'pointer';
            
            if (statusEl && !${simulationData.contentWarning}) {
              statusEl.className = 'status loading';
              statusEl.textContent = 'Loading simulation...';
            }
            
            executeSimulation();
          } else {
            console.error('Canvas element not found');
            if (statusEl) {
              statusEl.className = 'status error';
              statusEl.textContent = 'Canvas not found';
            }
          }
        }, 100);
        
        function executeSimulation() {
          try {
            ${simulationData.jsCode}
            
            ${!simulationData.contentWarning ? `
            setTimeout(() => {
              if (statusEl) {
                statusEl.className = 'status success';
                statusEl.textContent = 'Interactive';
                setTimeout(() => {
                  statusEl.style.opacity = '0.6';
                }, 2000);
              }
            }, 1000);
            ` : ''}
            
          } catch (error) {
            console.error('Execution Error:', error);
            if (statusEl) {
              statusEl.className = 'status error';
              statusEl.textContent = 'Error: ' + error.message;
            }
          }
        }
        
        window.addEventListener('resize', () => {
          setTimeout(resizeCanvas, 100);
        });
      </script>
    </body>
    </html>
  `, [simulationData.canvasHtml, simulationData.jsCode, simulationData.contentWarning]);

  return (
    <iframe
      className="w-full h-full border-0"
      title="Interactive Simulation"
      sandbox="allow-scripts"
      scrolling="no"
      srcDoc={iframeContent}
      style={{
        overflow: 'hidden',
        border: 'none',
        width: '100%',
        height: '100%'
      }}
    />
  );
});

export default function Demo(): JSX.Element {
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const [subject, setSubject] = useState<SubjectType>('Physics');
  const [prompt, setPrompt] = useState<string>('Show how a pendulum behaves under the influence of gravity and explain the energy transformations during its swing');
  const [followUpPrompt, setFollowUpPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showContentWarning, setShowContentWarning] = useState<boolean>(false);
  const [contentWarningMessage, setContentWarningMessage] = useState<string>('');

  const isDevAccount = useMemo(() => user?.user_metadata?.role === 'developer', [user?.user_metadata?.role]);
  const isTokenLimitReached = useMemo(() => !isDevAccount && tokenUsage >= TOKEN_LIMIT, [isDevAccount, tokenUsage]);
  const tokensRemaining = useMemo(() => Math.max(0, TOKEN_LIMIT - tokenUsage), [tokenUsage]);

  const fetchTokenUsage = useCallback(async () => {
    if (!user || isDevAccount) return;

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('No valid session found');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_token_total`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (typeof data.total_tokens === 'number' && data.total_tokens >= 0) {
        setTokenUsage(data.total_tokens);
      } else {
        throw new Error('Invalid response format');
      }

    } catch (error) {
      console.warn('Failed to fetch token usage:', error);
      setTokenUsage(0);
    }
  }, [user, isDevAccount]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchTokenUsage();
    }
  }, [user, authLoading, fetchTokenUsage]);

  const handleRunSimulation = useCallback(async (inputPrompt?: string): Promise<void> => {
    const currentPrompt = inputPrompt || prompt;
    if (!currentPrompt.trim()) return;
    
    const clientValidation = validatePromptClient(currentPrompt, subject);
    if (!clientValidation.isValid) {
      setError(clientValidation.reason!);
      return;
    }
    
    if (isTokenLimitReached) {
      setError(`Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`);
      return;
    }
    
    setLoading(true);
    setError(null);
    setShowContentWarning(false);
    setMobileMenuOpen(false);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error('No valid session found. Please log in again.');
      }

      const requestBody = {
        prompt: currentPrompt.trim(),
        subject: subject
      };

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Simulation failed: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Expected JSON response, got: ${contentType}`);
      }

      const data: SimulationResponse = await response.json();

      if (data.contentWarning) {
        setShowContentWarning(true);
        setContentWarningMessage(data.warningMessage || 'Content not suitable for educational platform');
        setSimulationData(data);
        return;
      }

      if ((data as any).error) {
        throw new Error(`Simulation error: ${(data as any).error}`);
      }

      if (!data.canvasHtml || !data.jsCode) {
        throw new Error('Invalid response format from simulation service');
      }

      setSimulationData(data);
      
      await fetchTokenUsage();

      if (inputPrompt) {
        setFollowUpPrompt('');
      }

    } catch (err: any) {
      console.error('Simulation error:', err);
      setError(err.message || 'An error occurred while generating the simulation');
    } finally {
      setLoading(false);
    }
  }, [prompt, subject, isTokenLimitReached, tokenUsage, isDevAccount, fetchTokenUsage]);

  const handleFollowUpSubmit = useCallback(async (): Promise<void> => {
    if (!followUpPrompt.trim()) return;
    if (isTokenLimitReached) {
      setError(`Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`);
      return;
    }
    await handleRunSimulation(followUpPrompt);
  }, [followUpPrompt, isTokenLimitReached, tokenUsage, handleRunSimulation]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut]);

  const handleNewSimulation = useCallback((): void => {
    setSimulationData(null);
    setPrompt('');
    setFollowUpPrompt('');
    setError(null);
    setShowContentWarning(false);
    setMobileMenuOpen(false);
    setMobileMenuOpen(false);
  }, []);

  const handleContentWarningDismiss = useCallback(() => {
    setShowContentWarning(false);
    setSimulationData(null);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <LoadingSpinner size="large" text="Loading authentication..." />
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
            href="/login"
            className="inline-flex items-center bg-yellow-500 text-black px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-yellow-400 transition-colors font-medium text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Create a user object that matches the DemoNavbar interface
  const demoUser: User = {
    email: user.email,
    id: user.id
  };

  return (
    <ErrorBoundary fallback={<div className="text-red-500 p-4">Something went wrong. Please refresh the page.</div>}>
      <div className="min-h-[100dvh] bg-gray-900 text-white flex flex-col">
        <DemoNavbar
          user={demoUser}
          isDevAccount={isDevAccount}
          tokenUsage={tokenUsage}
          isTokenLimitReached={isTokenLimitReached}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          handleSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[70vh]">
            <aside className="hidden md:flex md:col-span-2 bg-gray-800 border-r border-gray-700 flex-col">
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
                  <Monitor className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-xs font-semibold">Controls</h2>
                </div>

                {showContentWarning && (
                  <ContentWarningDisplay 
                    warningMessage={contentWarningMessage}
                    onDismiss={handleContentWarningDismiss}
                  />
                )}

                {!isDevAccount && isTokenLimitReached && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <div className="text-red-400 font-medium text-xs">Token Limit</div>
                    </div>
                    <div className="text-red-300 text-xs">
                      Used {tokenUsage}/{TOKEN_LIMIT} tokens.
                    </div>
                  </div>
                )}

                {!isDevAccount && !isTokenLimitReached && tokenUsage > TOKEN_LIMIT * 0.8 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                    <div className="flex items-center space-x-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-400" />
                      <div className="text-yellow-400 font-medium text-xs">Warning</div>
                    </div>
                    <div className="text-yellow-300 text-xs">
                      {tokensRemaining} tokens left.
                    </div>
                  </div>
                )}

                <SubjectSelector 
                  subject={subject}
                  onChange={setSubject}
                  disabled={isTokenLimitReached}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Educational Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`Describe a ${subject.toLowerCase()} concept to visualize...`}
                    disabled={isTokenLimitReached}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-white h-28 resize-none text-sm focus:ring-1 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {prompt.length}/500 • {subject} educational content
                  </div>
                </div>

                <button
                  onClick={() => handleRunSimulation()}
                  disabled={loading || !prompt.trim() || isTokenLimitReached}
                  className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm disabled:bg-gray-600 disabled:text-gray-400"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : isTokenLimitReached ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      <span>Limit</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" />
                      <span>Generate</span>
                    </>
                  )}
                </button>

                {simulationData && !isTokenLimitReached && !showContentWarning && (
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex items-center space-x-1 mb-1">
                      <MessageSquare className="w-3 h-3 text-blue-400" />
                      <label className="text-xs font-medium text-gray-300">
                        Follow-up
                      </label>
                    </div>
                    <div className="flex space-x-1 mb-2">
                      <input
                        type="text"
                        value={followUpPrompt}
                        onChange={(e) => setFollowUpPrompt(e.target.value)}
                        placeholder="Feature coming soon..."
                        disabled={true}
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        onKeyPress={(e) => e.key === 'Enter' && handleFollowUpSubmit()}
                      />
                      <button
                        onClick={handleFollowUpSubmit}
                        disabled={true}
                        className="bg-gray-600 text-white px-2 py-1 rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 italic">
                      Follow-up feature is still being worked on
                    </p>
                  </div>
                )}

                {simulationData && (
                  <button
                    onClick={handleNewSimulation}
                    className="w-full bg-gray-600 text-white py-1 px-2 rounded-md hover:bg-gray-500 transition-colors text-xs"
                  >
                    New Simulation
                  </button>
                )}

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2">
                    <div className="flex items-start space-x-1">
                      <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-red-400 font-medium text-xs">Error</div>
                        <div className="text-red-300 text-xs mt-1 break-words leading-tight">{error}</div>
                        <button
                          onClick={dismissError}
                          className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>

            <section className="order-2 md:order-none md:col-span-7 bg-white border-b md:border-b-0 md:border-r border-gray-300 flex flex-col min-h-[60vh] md:h-full">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <Monitor className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    {subject} Simulation
                  </h2>
                  {simulationData && !showContentWarning && (
                    <div className="ml-auto">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                        Interactive
                      </span>
                    </div>
                  )}
                  {showContentWarning && (
                    <div className="ml-auto">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                        Content Notice
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
                {loading && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 backdrop-blur-sm">
                    <LoadingSpinner size="large" text={`Generating ${subject.toLowerCase()} simulation...`} />
                  </div>
                )}
                
                {simulationData ? (
                  <SimulationIframe simulationData={simulationData} />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        {React.createElement(SUBJECT_INFO[subject].icon, { className: "w-12 h-12 text-blue-600" })}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        Ready for {subject}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-4">
                        {isTokenLimitReached 
                          ? `Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Contact support to continue.`
                          : `Describe a ${subject.toLowerCase()} concept you'd like to visualize and interact with.`
                        }
                      </p>
                      <div className="text-sm text-gray-500">
                        <strong>Examples:</strong> {SUBJECT_INFO[subject].examples.slice(0, 2).join(', ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="order-3 md:order-none md:col-span-3 bg-gray-50 flex flex-col min-h-[40vh] md:h-full">
              <div className="bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-800">Explanation</h2>
                  {simulationData?.explanation && !showContentWarning && (
                    <div className="ml-auto">
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full font-medium">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-2">
                {simulationData?.explanation && !showContentWarning ? (
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 h-full">
                    <FormattedExplanation explanation={simulationData.explanation} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="max-w-xs">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        Explanation Ready
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        Generate a {subject.toLowerCase()} simulation to see a detailed explanation of the concepts and educational value.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}