import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import MobileBlockOverlay from './components/MobileBlockOverlay';
import './index.css';

const isAuthCallback = window.location.pathname.startsWith('/auth/callback');

const ua = navigator.userAgent;
const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
const hasTouch = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
const viewportNarrow = window.innerWidth < 768;
const shouldBlock = !isAuthCallback && hasTouch && (viewportNarrow || isMobileUA);

const root = ReactDOM.createRoot(document.getElementById('root')!);

if (shouldBlock) {
  try {
    window.dispatchEvent(
      new CustomEvent('mobile_blocked_shown', {
        detail: {
          path: window.location.pathname,
          width: window.innerWidth,
          height: window.innerHeight,
        },
      })
    );
  } catch (err) {
    // ignore analytics errors
  }

  root.render(<MobileBlockOverlay />);
} else {
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
