import { computeDistanceDistance, computeBearingBearing } from './numerical/intersection.js';
import { Point3D } from './core/types.js';

// Get DOM elements
const gridCanvas = document.getElementById('grid-layer') as HTMLCanvasElement;
const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
const activeCanvas = document.getElementById('active-layer') as HTMLCanvasElement;
const dpiVal = document.getElementById('dpi-val');
const coordReadout = document.getElementById('coord-readout');

const canvases = [gridCanvas, mainCanvas, activeCanvas];

// Application State
const state = {
  dpr: 1,
  width: window.innerWidth,
  height: window.innerHeight,
  mouse: { x: 0, y: 0 }
};

/**
 * Normalizes all canvas resolutions based on the device pixel ratio (DPR)
 * to ensure lines are ultra-sharp on high-end displays.
 */
const resizeWorkspace = (): void => {
  state.dpr = window.devicePixelRatio || 1;
  state.width = window.innerWidth;
  state.height = window.innerHeight;

  if (dpiVal) {
    dpiVal.textContent = state.dpr.toFixed(1);
  }

  canvases.forEach(canvas => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set layout size
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    
    // Set internal render resolution scaled by DPR
    canvas.width = state.width * state.dpr;
    canvas.height = state.height * state.dpr;
    
    // Normalize coordinates back to CSS pixels
    ctx?.scale(state.dpr, state.dpr);
  });

  // Redraw structural base grid whenever resolution shifts
  drawBackgroundGrid();
};

/**
 * Draws a clean, engineering-style background grid on the bottom layer.
 */
const drawBackgroundGrid = (): void => {
  const ctx = gridCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, state.width, state.height);
  ctx.strokeStyle = '#1A4D2E'; // Dark forest green accent
  ctx.lineWidth = 0.5;

  const gridSize = 50;

  // Vertical Grid Lines
  for (let x = 0; x < state.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, state.height);
    ctx.stroke();
  }

  // Horizontal Grid Lines
  for (let y = 0; y < state.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.width, y);
    ctx.stroke();
  }
};

/**
 * Handles live rendering on the active/top tracking layer.
 */
const renderActiveTracking = (): void => {
  const ctx = activeCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, state.width, state.height);

  // Draw a precision crosshair around the user's cursor
  ctx.strokeStyle = '#82ff6f'; // Neon emerald accent
  ctx.lineWidth = 1;
  
  const size = 15;
  ctx.beginPath();
  // Horizontal crosshair snippet
  ctx.moveTo(state.mouse.x - size, state.mouse.y);
  ctx.lineTo(state.mouse.x + size, state.mouse.y);
  // Vertical crosshair snippet
  ctx.moveTo(state.mouse.x, state.mouse.y - size);
  ctx.lineTo(state.mouse.x, state.mouse.y + size);
  ctx.stroke();
};

// Track mouse positioning across viewport
window.addEventListener('mousemove', (e) => {
  // Map viewport coordinates
  state.mouse.x = e.clientX;
  state.mouse.y = e.clientY;

  // Update neon green digital readout: Y down inversion to replicate real-world surveying layouts
  if (coordReadout) {
    const surveyingY = (state.height - state.mouse.y).toFixed(2);
    const surveyingX = state.mouse.x.toFixed(2);
    coordReadout.textContent = `X: ${surveyingX} / Y: ${surveyingY}`;
  }

  // Request high-performance visual frame refresh
  requestAnimationFrame(renderActiveTracking);
});

// Setup workspace parameters and attach window resize hooks
window.addEventListener('resize', resizeWorkspace);
resizeWorkspace();