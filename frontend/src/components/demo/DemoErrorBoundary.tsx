import React, { useState, useEffect } from "react";

interface DemoErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

const DemoErrorBoundary = ({ children, fallback }: DemoErrorBoundaryProps) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default React.memo(DemoErrorBoundary);
