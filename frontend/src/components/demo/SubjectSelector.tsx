import React from "react";
import { SUBJECTS, SUBJECT_INFO, SubjectType } from "../../constants/subjects";

interface SubjectSelectorProps {
  subject: SubjectType;
  onChange: (value: SubjectType) => void;
  disabled: boolean;
}

const SubjectSelector = React.memo(
  ({ subject, onChange, disabled }: SubjectSelectorProps) => (
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
          <option key={subj} value={subj}>
            {subj}
          </option>
        ))}
      </select>

      <div className="mt-2 p-2 bg-gray-600/30 rounded-md">
        <div className="flex items-center space-x-2 mb-1">
          {React.createElement(SUBJECT_INFO[subject].icon, {
            className: "w-4 h-4 text-yellow-400",
          })}
          <span className="text-xs font-medium text-gray-300">{subject}</span>
        </div>
        <p className="text-xs text-gray-400 mb-2">
          {SUBJECT_INFO[subject].description}
        </p>
        <div className="text-xs text-gray-500">
          <strong>Try:</strong> {SUBJECT_INFO[subject].examples.join(", ")}
        </div>
      </div>
    </div>
  )
);

export default SubjectSelector;
