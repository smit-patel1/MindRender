import React, { useMemo } from "react";
import { SimulationResponse } from "../../types/demo";

interface SimulationFrameProps {
  simulationData: SimulationResponse;
}

const SimulationFrame = React.memo(({ simulationData }: SimulationFrameProps) => {
  const iframeContent = useMemo(
    () => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'none';">
      <title>MindRender Simulation</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          height: 100%;
          width: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        canvas {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          background: white;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          display: block !important;
          margin: 0 auto;
          max-width: 100%;
          max-height: 100%;
          cursor: pointer;
        }

        .status {
          position: fixed;
          top: 15px;
          right: 15px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          z-index: 1000;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          transition: all 0.3s ease;
          opacity: 0.9;
        }
        .status.loading {
          background: rgba(59, 130, 246, 0.15);
          color: #1e40af;
          border-color: rgba(59, 130, 246, 0.4);
        }
        .status.success {
          background: rgba(16, 185, 129, 0.15);
          color: #059669;
          border-color: rgba(16, 185, 129, 0.4);
        }
        .status.error {
          background: rgba(239, 68, 68, 0.15);
          color: #dc2626;
          border-color: rgba(239, 68, 68, 0.4);
        }
        .status.warning {
          background: rgba(245, 158, 11, 0.15);
          color: #d97706;
          border-color: rgba(245, 158, 11, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="status ${
        simulationData.contentWarning ? "warning" : "loading"
      }" id="status">${
        simulationData.contentWarning ? "Content Notice" : "Initializing..."
      }</div>

      ${simulationData.canvasHtml}

      <script>
        const statusEl = document.getElementById('status');

        function resizeCanvas() {
          const canvas = document.querySelector('canvas');
          if (!canvas) return;

          const originalWidth = canvas.width || 800;
          const originalHeight = canvas.height || 600;
          const aspectRatio = originalWidth / originalHeight;

          const availableWidth = window.innerWidth * 0.92;
          const availableHeight = window.innerHeight * 0.92;

          let newWidth, newHeight;

          if (availableWidth / aspectRatio <= availableHeight) {
            newWidth = availableWidth;
            newHeight = availableWidth / aspectRatio;
          } else {
            newHeight = availableHeight;
            newWidth = availableHeight * aspectRatio;
          }

          newWidth = Math.max(newWidth, 400);
          newHeight = Math.max(newHeight, 300);

          canvas.width = Math.floor(newWidth);
          canvas.height = Math.floor(newHeight);

          canvas.style.width = Math.floor(newWidth) + 'px';
          canvas.style.height = Math.floor(newHeight) + 'px';

          console.log('Canvas resized to:', Math.floor(newWidth) + 'x' + Math.floor(newHeight));
        }

        window.onerror = function(message, source, lineno, colno, error) {
          console.error('Simulation Error:', message, 'Line:', lineno);
          if (statusEl) {
            statusEl.className = 'status error';
            statusEl.textContent = 'Script Error';
          }
          return true;
        };

        setTimeout(() => {
          const canvas = document.querySelector('canvas');
          if (canvas) {
            console.log('Canvas found, original size:', canvas.width + 'x' + canvas.height);

            resizeCanvas();

            canvas.style.display = 'block';
            canvas.style.margin = '0 auto';
            canvas.style.cursor = 'pointer';

            if (statusEl && !${simulationData.contentWarning}) {
              statusEl.className = 'status loading';
              statusEl.textContent = 'Loading simulation...';
            }

            executeSimulation();
          } else {
            console.error('Canvas element not found');
            if (statusEl) {
              statusEl.className = 'status error';
              statusEl.textContent = 'Canvas not found';
            }
          }
        }, 100);

        function executeSimulation() {
          try {
            ${simulationData.jsCode}

            ${
              !simulationData.contentWarning
                ? `
            setTimeout(() => {
              if (statusEl) {
                statusEl.className = 'status success';
                statusEl.textContent = 'Interactive';
                setTimeout(() => {
                  statusEl.style.opacity = '0.6';
                }, 2000);
              }
            }, 1000);
            `
                : ""
            }

          } catch (error) {
            console.error('Execution Error:', error);
            if (statusEl) {
              statusEl.className = 'status error';
              statusEl.textContent = 'Error: ' + error.message;
            }
          }
        }

        window.addEventListener('resize', () => {
          setTimeout(resizeCanvas, 100);
        });
      </script>
    </body>
    </html>
  `,
    [
      simulationData.canvasHtml,
      simulationData.jsCode,
      simulationData.contentWarning,
    ]
  );

  return (
    <iframe
      className="w-full h-full border-0"
      title="Interactive Simulation"
      sandbox="allow-scripts"
      scrolling="no"
      srcDoc={iframeContent}
      style={{
        overflow: "hidden",
        border: "none",
        width: "100%",
        height: "100%",
      }}
    />
  );
});

export default SimulationFrame;
