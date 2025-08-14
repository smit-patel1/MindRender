import React, { useEffect, useRef } from 'react';

const SimFrame: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleSimulationPayload(event: MessageEvent) {
      const { canvasHtml, jsCode } = event.data || {};
      if (typeof canvasHtml === 'string' && typeof jsCode === 'string') {
        if (containerRef.current) {
          containerRef.current.innerHTML = canvasHtml;
          const scriptEl = document.createElement('script');
          scriptEl.type = 'text/javascript';
          scriptEl.textContent = jsCode;
          containerRef.current.appendChild(scriptEl);
        }
      }
    }

    window.addEventListener('message', handleSimulationPayload);
    return () => {
      window.removeEventListener('message', handleSimulationPayload);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default SimFrame;
