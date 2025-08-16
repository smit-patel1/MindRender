import React, { useRef } from 'react';
import { SimulationResponse } from '../../types/demo';

interface SimulationFrameProps {
  simulationData: SimulationResponse;
}

const SimulationFrame: React.FC<SimulationFrameProps> = React.memo(({ simulationData }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        canvasHtml: simulationData.canvasHtml,
        jsCode: simulationData.jsCode,
        contentWarning: simulationData.contentWarning,
      },
      '*'
    );
  };

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Interactive Simulation"
      sandbox="allow-scripts"
      scrolling="no"
      src="/sim-frame"
      onLoad={handleLoad}
      style={{
        overflow: 'hidden',
        border: 'none',
        width: '100%',
        height: '100%',\n        display: 'block',\n        backgroundColor: 'transparent',
      }}
    />
  );
});

export default SimulationFrame;
