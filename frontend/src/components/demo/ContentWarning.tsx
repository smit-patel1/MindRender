import React from "react";
import { ShieldAlert } from "lucide-react";

interface ContentWarningProps {
  warningMessage: string;
  onDismiss: () => void;
}

const ContentWarning = React.memo(({ warningMessage, onDismiss }: ContentWarningProps) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
    <div className="flex items-start space-x-2">
      <ShieldAlert className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-xs font-semibold text-yellow-900 mb-1">
          Content Notice
        </h4>
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
));

export default ContentWarning;
