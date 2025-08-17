let allowedOrigin = null;
const statusEl = document.getElementById('status');

function resizeCanvas() {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const originalWidth = canvas.getAttribute('data-original-width') || canvas.width || 800;
  const originalHeight = canvas.getAttribute('data-original-height') || canvas.height || 600;
  if (!canvas.getAttribute('data-original-width')) {
    canvas.setAttribute('data-original-width', originalWidth);
    canvas.setAttribute('data-original-height', originalHeight);
  }
  const aspectRatio = originalWidth / originalHeight;
  const availableWidth = window.innerWidth - 40;
  const availableHeight = window.innerHeight - 40;
  let displayWidth, displayHeight;
  if (availableWidth / aspectRatio <= availableHeight) {
    displayWidth = availableWidth;
    displayHeight = availableWidth / aspectRatio;
  } else {
    displayHeight = availableHeight;
    displayWidth = availableHeight * aspectRatio;
  }
  displayWidth = Math.max(displayWidth, 320);
  displayHeight = Math.max(displayHeight, 240);
  const canvasWidth = Math.floor(displayWidth * dpr);
  const canvasHeight = Math.floor(displayHeight * dpr);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
}

window.addEventListener('resize', () => setTimeout(resizeCanvas, 150));
window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 500));

window.addEventListener('message', (event) => {
  if (!allowedOrigin) allowedOrigin = event.origin;
  if (event.origin !== allowedOrigin) return;
  const { type, canvasHtml, jsCode, contentWarning } = event.data || {};
  if (type !== 'MINDRENDER_SIM') return;
  document.getElementById('root').innerHTML = canvasHtml || '';
  try {
    const blob = new Blob([jsCode || ''], { type: 'text/javascript' });
    const scriptEl = document.createElement('script');
    scriptEl.src = URL.createObjectURL(blob);
    scriptEl.onload = () => URL.revokeObjectURL(scriptEl.src);
    document.body.appendChild(scriptEl);
    resizeCanvas();
    if (!contentWarning) {
      statusEl.textContent = 'Interactive';
    }
    window.parent.postMessage({ type: 'MINDRENDER_SIM_READY' }, allowedOrigin);
  } catch (err) {
    statusEl.textContent = 'Error: ' + err.message;
    statusEl.className = 'status error';
  }
});

window.onerror = function () {
  statusEl.textContent = 'Script Error';
  statusEl.className = 'status error';
  return true;
};
