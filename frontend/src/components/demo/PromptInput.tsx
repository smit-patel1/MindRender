import React from "react";
import { SubjectType } from "../../constants/subjects";

interface PromptInputProps {
  subject: SubjectType;
  prompt: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

const PromptInput = React.memo(
  ({ subject, prompt, onChange, disabled }: PromptInputProps) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        Educational Prompt
      </label>
      <textarea
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Describe a ${subject.toLowerCase()} concept to visualize...`}
        disabled={disabled}
        className="w-full bg-gray-700 border border-gray-600 rounded-md px-2 py-2 text-white h-28 resize-none text-sm focus:ring-1 focus:ring-yellow-500 focus:border-transparent transition-colors placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <div className="text-xs text-gray-400 mt-1">
        {prompt.length}/500 • {subject} educational content
      </div>
    </div>
  )
);

export default PromptInput;
