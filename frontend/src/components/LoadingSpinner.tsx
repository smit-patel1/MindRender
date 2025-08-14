import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "small" | "default" | "large";
  text?: string;
}

const sizeClasses = {
  small: "w-4 h-4",
  default: "w-8 h-8",
  large: "w-12 h-12",
} as const;

const LoadingSpinner = React.memo(
  ({ size = "default", text }: LoadingSpinnerProps) => (
    <div className="flex flex-col items-center space-y-2">
      <Loader2 className={`${sizeClasses[size]} text-blue-500 animate-spin`} />
      {text && <div className="text-gray-700 font-medium text-sm">{text}</div>}
    </div>
  )
);

export default LoadingSpinner;
