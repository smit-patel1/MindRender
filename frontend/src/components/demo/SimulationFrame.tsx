import React, { useRef, useEffect } from 'react';
import { SimulationResponse } from '../../types/demo';

interface SimulationFrameProps {
  simulationData: SimulationResponse;
}

const SimulationFrame: React.FC<SimulationFrameProps> = ({ simulationData }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const sendMessageToIframe = () => {
    if (iframeRef.current?.contentWindow && simulationData.canvasHtml && simulationData.jsCode) {
      console.log('Sending message to iframe:', {
        canvasHtmlLength: simulationData.canvasHtml.length,
        jsCodeLength: simulationData.jsCode.length,
        contentWarning: simulationData.contentWarning
      });
      
      iframeRef.current.contentWindow.postMessage(
        {
          canvasHtml: simulationData.canvasHtml,
          jsCode: simulationData.jsCode,
          contentWarning: simulationData.contentWarning,
        },
        '*'
      );
    } else {
      console.warn('Cannot send message to iframe:', {
        hasContentWindow: !!iframeRef.current?.contentWindow,
        hasCanvasHtml: !!simulationData.canvasHtml,
        hasJsCode: !!simulationData.jsCode
      });
    }
  };

  const handleLoad = () => {
    // Send initial message when iframe loads
    sendMessageToIframe();
  };

  // Send message whenever simulationData changes
  useEffect(() => {
    if (simulationData.canvasHtml && simulationData.jsCode) {
      // Small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        sendMessageToIframe();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [simulationData.canvasHtml, simulationData.jsCode, simulationData.contentWarning]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Interactive Simulation"
      sandbox="allow-scripts allow-same-origin"
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
