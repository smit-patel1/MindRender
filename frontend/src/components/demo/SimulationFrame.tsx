import React, { useRef, useEffect } from 'react';
import { SimulationResponse } from '../../types/demo';

interface SimulationFrameProps {
  simulationData: SimulationResponse;
}

const SimulationFrame: React.FC<SimulationFrameProps> = ({ simulationData }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendMessageToIframe = () => {
    if (
      iframeRef.current?.contentWindow &&
      simulationData.canvasHtml &&
      simulationData.jsCode
    ) {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'MINDRENDER_SIM',
          canvasHtml: simulationData.canvasHtml,
          jsCode: simulationData.jsCode,
          contentWarning: simulationData.contentWarning,
        },
        window.location.origin
      );
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'MINDRENDER_SIM_READY') {
        console.log('Simulation iframe ready');
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleLoad = () => {
    sendMessageToIframe();
  };

  useEffect(() => {
    if (simulationData.canvasHtml && simulationData.jsCode) {
      const timer = setTimeout(() => {
        sendMessageToIframe();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [
    simulationData.canvasHtml,
    simulationData.jsCode,
    simulationData.contentWarning,
  ]);

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
