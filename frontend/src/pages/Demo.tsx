import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthProvider";
import { supabase } from "../lib/supabaseClient";
import { TOKEN_LIMIT } from "../constants";
import { SUBJECT_INFO, SubjectType } from "../constants/subjects";
import { SimulationResponse, User } from "../types/demo";
import { LogOut, Monitor, BookOpen } from "lucide-react";
import DemoNavbar from "../components/DemoNavbar";
import DemoErrorBoundary from "../components/demo/DemoErrorBoundary";
import LoadingSpinner from "../components/LoadingSpinner";
import SubjectSelector from "../components/demo/SubjectSelector";
import PromptInput from "../components/demo/PromptInput";
import RunButton from "../components/demo/RunButton";
import TokenNotices from "../components/demo/TokenNotices";
import SimulationFrame from "../components/demo/SimulationFrame";
import ExplanationPanel from "../components/demo/ExplanationPanel";
import ErrorBanner from "../components/demo/ErrorBanner";
import ContentWarning from "../components/demo/ContentWarning";
import FollowUpBox from "../components/demo/FollowUpBox";

const validatePromptClient = (
  prompt: string,
  subject: string
): { isValid: boolean; reason?: string } => {
  const STRICTLY_BLOCKED_KEYWORDS = [
    "kiss",
    "kissing",
    "sexual",
    "nude",
    "naked",
    "porn",
    "sex",
    "erotic",
    "intimate",
    "romance",
    "dating",
    "kill",
    "murder",
    "blood",
    "death",
    "hate",
    "racist",
    "terrorist",
    "drug",
    "alcohol",
    "suicide",
  ];

  const UNAVAILABLE_SUBJECTS = ["mathematics", "chemistry", "math", "chem"];

  const lowerPrompt = prompt.toLowerCase();

  const unavailableSubject = UNAVAILABLE_SUBJECTS.find(
    (subj) =>
      lowerPrompt.includes(subj) && !lowerPrompt.includes(subject.toLowerCase())
  );

  if (unavailableSubject) {
    return {
      isValid: false,
      reason: `${
        unavailableSubject.charAt(0).toUpperCase() + unavailableSubject.slice(1)
      } simulations will be available in future updates. Currently available: Physics, Biology, and Computer Science.`,
    };
  }

  const blockedWord = STRICTLY_BLOCKED_KEYWORDS.find((keyword) =>
    lowerPrompt.includes(keyword.toLowerCase())
  );

  if (blockedWord) {
    return {
      isValid: false,
      reason: `Content not suitable for educational platform. Please focus on academic ${subject} topics.`,
    };
  }

  if (prompt.trim().length < 15) {
    return {
      isValid: false,
      reason: `Please provide a more detailed educational prompt (minimum 15 characters).`,
    };
  }

  return { isValid: true };
};

export default function Demo(): JSX.Element {
  const {
    user,
    loading: authLoading,
    error: authError,
    signOut,
    isDeveloper,
  } = useAuth();
  const [subject, setSubject] = useState<SubjectType>("Physics");
  const [prompt, setPrompt] = useState<string>(
    "Show how a pendulum behaves under the influence of gravity and explain the energy transformations during its swing"
  );
  const [followUpPrompt, setFollowUpPrompt] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [simulationData, setSimulationData] =
    useState<SimulationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showContentWarning, setShowContentWarning] = useState<boolean>(false);
  const [contentWarningMessage, setContentWarningMessage] =
    useState<string>("");

  const isTokenLimitReached = useMemo(
    () => !isDeveloper && tokenUsage >= TOKEN_LIMIT,
    [isDeveloper, tokenUsage]
  );
  const tokensRemaining = useMemo(
    () => Math.max(0, TOKEN_LIMIT - tokenUsage),
    [tokenUsage]
  );

  const fetchTokenUsage = useCallback(async () => {
    if (!user || isDeveloper) return;

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        throw new Error("No valid session found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get_token_total`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (typeof data.total_tokens === "number" && data.total_tokens >= 0) {
        setTokenUsage(data.total_tokens);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.warn("Failed to fetch token usage:", error);
      setTokenUsage(0);
    }
  }, [user, isDeveloper]);

  useEffect(() => {
    if (user && !authLoading) {
      fetchTokenUsage();
    }
  }, [user, authLoading, fetchTokenUsage]);

  const handleRunSimulation = useCallback(
    async (inputPrompt?: string): Promise<void> => {
      const currentPrompt = inputPrompt || prompt;
      if (!currentPrompt.trim()) return;

      const clientValidation = validatePromptClient(currentPrompt, subject);
      if (!clientValidation.isValid) {
        setError(clientValidation.reason!);
        return;
      }

      if (isTokenLimitReached) {
        setError(
          `Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`
        );
        return;
      }

      setLoading(true);
      setError(null);
      setShowContentWarning(false);
      setMobileMenuOpen(false);

      try {
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData?.session?.access_token) {
          throw new Error("No valid session found. Please log in again.");
        }

        const requestBody = {
          prompt: currentPrompt.trim(),
          subject: subject,
        };

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/simulate`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify(requestBody),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Simulation failed: ${response.status} ${response.statusText}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          const textResponse = await response.text();
          throw new Error(`Expected JSON response, got: ${contentType}`);
        }

        const data: SimulationResponse = await response.json();

        if (data.contentWarning) {
          setShowContentWarning(true);
          setContentWarningMessage(
            data.warningMessage ||
              "Content not suitable for educational platform"
          );
          setSimulationData(data);
          return;
        }

        if ((data as any).error) {
          throw new Error(`Simulation error: ${(data as any).error}`);
        }

        if (!data.canvasHtml || !data.jsCode) {
          throw new Error("Invalid response format from simulation service");
        }

        setSimulationData(data);

        await fetchTokenUsage();

        if (inputPrompt) {
          setFollowUpPrompt("");
        }
      } catch (err: any) {
        console.error("Simulation error:", err);
        setError(
          err.message || "An error occurred while generating the simulation"
        );
      } finally {
        setLoading(false);
      }
    },
    [
      prompt,
      subject,
      isTokenLimitReached,
      tokenUsage,
      isDeveloper,
      fetchTokenUsage,
    ]
  );

  const handleFollowUpSubmit = useCallback(async (): Promise<void> => {
    if (!followUpPrompt.trim()) return;
    if (isTokenLimitReached) {
      setError(
        `Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Cannot run more simulations.`
      );
      return;
    }
    await handleRunSimulation(followUpPrompt);
  }, [followUpPrompt, isTokenLimitReached, tokenUsage, handleRunSimulation]);

  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, [signOut]);

  const handleNewSimulation = useCallback((): void => {
    setSimulationData(null);
    setPrompt("");
    setFollowUpPrompt("");
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
    setMobileMenuOpen((prev) => !prev);
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
            <div className="text-lg sm:text-xl font-semibold mb-2">
              Authentication Error
            </div>
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
          <div className="text-white text-lg sm:text-xl font-semibold mb-4">
            Access Required
          </div>
          <div className="text-gray-300 mb-6 text-sm sm:text-base">
            Please log in to access the MindRender demo
          </div>
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
    id: user.id,
  };

  return (
    <DemoErrorBoundary
      fallback={
        <div className="text-red-500 p-4">
          Something went wrong. Please refresh the page.
        </div>
      }
    >
      <div className="h-screen bg-gray-900 text-white overflow-hidden flex flex-col">
        <DemoNavbar
          user={demoUser}
          isDeveloper={isDeveloper}
          tokenUsage={tokenUsage}
          isTokenLimitReached={isTokenLimitReached}
          mobileMenuOpen={mobileMenuOpen}
          toggleMobileMenu={toggleMobileMenu}
          handleSignOut={handleSignOut}
        />

        <main className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12 h-full">
            <aside className="order-1 md:order-none md:col-span-2 lg:col-span-2 xl:col-span-2 bg-gray-800 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col h-full">
              <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-700">
                  <Monitor className="w-4 h-4 text-yellow-500" />
                  <h2 className="text-xs font-semibold">Controls</h2>
                </div>

                {showContentWarning && (
                  <ContentWarning
                    warningMessage={contentWarningMessage}
                    onDismiss={handleContentWarningDismiss}
                  />
                )}

                <TokenNotices
                  isDeveloper={isDeveloper}
                  isTokenLimitReached={isTokenLimitReached}
                  tokenUsage={tokenUsage}
                  tokensRemaining={tokensRemaining}
                />

                <SubjectSelector
                  subject={subject}
                  onChange={setSubject}
                  disabled={isTokenLimitReached}
                />

                <PromptInput
                  subject={subject}
                  prompt={prompt}
                  onChange={setPrompt}
                  disabled={isTokenLimitReached}
                />

                <RunButton
                  onClick={() => handleRunSimulation()}
                  disabled={loading || !prompt.trim() || isTokenLimitReached}
                  isLoading={loading}
                  isTokenLimitReached={isTokenLimitReached}
                />

                {simulationData &&
                  !isTokenLimitReached &&
                  !showContentWarning && (
                    <FollowUpBox
                      value={followUpPrompt}
                      onChange={setFollowUpPrompt}
                      onSubmit={handleFollowUpSubmit}
                      disabled={true}
                    />
                  )}

                {simulationData && (
                  <button
                    onClick={handleNewSimulation}
                    className="w-full bg-gray-600 text-white py-1 px-2 rounded-md hover:bg-gray-500 transition-colors text-xs"
                  >
                    New Simulation
                  </button>
                )}

                {error && <ErrorBanner error={error} onDismiss={dismissError} />}
              </div>
            </aside>

            <section className="order-2 md:order-none md:col-span-8 lg:col-span-8 xl:col-span-8 bg-white border-b md:border-b-0 md:border-r border-gray-300 flex flex-col h-full">
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

              <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white min-h-0">
                {loading && (
                  <div className="absolute inset-0 bg-white/95 flex items-center justify-center z-10 backdrop-blur-sm">
                    <LoadingSpinner
                      size="large"
                      text={`Generating ${subject.toLowerCase()} simulation...`}
                    />
                  </div>
                )}

                {simulationData ? (
                  <SimulationFrame simulationData={simulationData} />
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                        {React.createElement(SUBJECT_INFO[subject].icon, {
                          className: "w-12 h-12 text-blue-600",
                        })}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-3">
                        Ready for {subject}
                      </h3>
                      <p className="text-gray-600 text-lg leading-relaxed mb-4">
                        {isTokenLimitReached
                          ? `Token limit reached (${tokenUsage}/${TOKEN_LIMIT}). Contact support to continue.`
                          : `Describe a ${subject.toLowerCase()} concept you'd like to visualize and interact with.`}
                      </p>
                      <div className="text-sm text-gray-500">
                        <strong>Examples:</strong>{" "}
                        {SUBJECT_INFO[subject].examples.slice(0, 2).join(", ")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <aside className="order-3 md:order-none md:col-span-2 lg:col-span-2 xl:col-span-2 bg-gray-50 flex flex-col h-full">
              <div className="bg-white border-b border-gray-200 px-3 py-3 flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-800">
                    Explanation
                  </h2>
                  {simulationData?.explanation && !showContentWarning && (
                    <div className="ml-auto">
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded-full font-medium">
                        Ready
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-hidden p-2">
                {simulationData?.explanation && !showContentWarning ? (
                  <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 h-full">
                    <ExplanationPanel
                      explanation={simulationData.explanation}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="max-w-xs">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-medium text-gray-600 mb-2">
                        Explanation Ready
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        Generate a {subject.toLowerCase()} simulation to see a
                        detailed explanation of the concepts and educational
                        value.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>
    </DemoErrorBoundary>
  );
}
