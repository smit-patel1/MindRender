import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBannerProps {
  error: string;
  onDismiss: () => void;
}

const ErrorBanner = React.memo(({ error, onDismiss }: ErrorBannerProps) => (
  <div className="bg-red-500/10 border border-red-500/20 rounded-md p-2">
    <div className="flex items-start space-x-1">
      <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <div className="text-red-400 font-medium text-xs">Error</div>
        <div className="text-red-300 text-xs mt-1 break-words leading-tight">
          {error}
        </div>
        <button
          onClick={onDismiss}
          className="text-red-400 hover:text-red-300 text-xs mt-1 underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  </div>
));

export default ErrorBanner;
