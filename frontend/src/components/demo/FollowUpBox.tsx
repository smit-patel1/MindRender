import React from "react";
import { MessageSquare, Send } from "lucide-react";

interface FollowUpBoxProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled: boolean;
}

const FollowUpBox = React.memo(
  ({ value, onChange, onSubmit, disabled }: FollowUpBoxProps) => (
    <div className="pt-2 border-t border-gray-700">
      <div className="flex items-center space-x-1 mb-1">
        <MessageSquare className="w-3 h-3 text-blue-400" />
        <label className="text-xs font-medium text-gray-300">Follow-up</label>
      </div>
      <div className="flex space-x-1 mb-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Feature coming soon..."
          disabled={disabled}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-white text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          onKeyPress={(e) => e.key === "Enter" && onSubmit()}
        />
        <button
          onClick={onSubmit}
          disabled={disabled}
          className="bg-gray-600 text-white px-2 py-1 rounded-md transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-3 h-3" />
        </button>
      </div>
      <p className="text-xs text-gray-500 italic">
        Follow-up feature is still being worked on
      </p>
    </div>
  )
);

export default FollowUpBox;
