import React, { useRef, useEffect } from 'react';
import { SimulationResponse } from '../../types/demo';

interface SimulationFrameProps {
  simulationData: SimulationResponse;
}

const SimulationFrame: React.FC<SimulationFrameProps> = ({ simulationData }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendMessageToIframe = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        {
          canvasHtml: simulationData.canvasHtml,
          jsCode: simulationData.jsCode,
          contentWarning: simulationData.contentWarning,
        },
        '*'
      );
    }
  };

  const handleLoad = () => {
    // Send initial message when iframe loads
    sendMessageToIframe();
  };

  // Send message whenever simulationData changes
  useEffect(() => {
    sendMessageToIframe();
  }, [simulationData.canvasHtml, simulationData.jsCode, simulationData.contentWarning]);

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
        height: '100%',
        display: 'block',
        backgroundColor: 'transparent',
      }}
    />
  );
};

export default SimulationFrame;
