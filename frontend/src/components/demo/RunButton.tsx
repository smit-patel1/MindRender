import React from "react";
import { Play, Loader2, AlertTriangle } from "lucide-react";

interface RunButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  isTokenLimitReached: boolean;
}

const RunButton = React.memo(
  ({ onClick, disabled, isLoading, isTokenLimitReached }: RunButtonProps) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full bg-yellow-500 text-black py-2 rounded-md hover:bg-yellow-400 transition-colors flex items-center justify-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm disabled:bg-gray-600 disabled:text-gray-400"
    >
      {isLoading ? (
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
  )
);

export default RunButton;
