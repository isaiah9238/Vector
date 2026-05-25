class ArithmaGenEngine {
  private ctxs: { [key: string]: CanvasRenderingContext2D } = {};
  private dpr: number = window.devicePixelRatio || 1;
  private fov: number = 400;
  private rotation = { x: 0.5, y: 0.8 };
  
  // Session, Calibration, & Absolute Spatial Truth State
  private isCalibrated: boolean = false;
  private sessionShots: { id: string; x: number; y: number; z: number }[] = [];
  private station = { x: 0, y: 0, z: 0 };
  private benchmarks = [
    { id: 'P1', x: 0, y: 0, z: 0 },
    { id: 'P2', x: 0, y: 500, z: 20 },
    { id: 'P3', x: 500, y: 500, z: 10 },
    { id: 'P4', x: 250, y: 800, z: 30 }
  ];
  
  // The "Bubble of Fog" & Funnel properties
  private pathHistory: { x: number; y: number; z: number; age: number }[] = [];
  private maxHistory = 50;
  private bubbleRadius = 400;

  constructor() {
    this.setup();
    this.initEvents();
    
    // MOCK TEST: Simulate taking 3 perfect total station shots matching benchmarks
    this.sessionShots = [
      { id: 'P1', x: 0, y: 0, z: 0 },
      { id: 'P2', x: 0, y: 500, z: 20 },
      { id: 'P3', x: 500, y: 500, z: 10 }
    ];
  
    // Fire verification to drop the fog and render the 3D grid
    this.verifySession();
  }

  private setup() {
    const ids = ['grid-layer', 'main-canvas', 'active-layer'];
    ids.forEach(id => {
      const canvas = document.getElementById(id) as HTMLCanvasElement;
      if (canvas) this.ctxs[id] = canvas.getContext('2d')!;
    });
    this.sync();
  }

  private initEvents() {
    window.addEventListener('resize', () => this.sync());
    window.addEventListener('mousemove', (e) => {
      const readout = document.getElementById('coord-readout');
      if (readout) {
        const x = (e.clientX - window.innerWidth / 2).toFixed(2);
        // Invert browser Y so that moving the cursor UP yields positive values
        const y = (window.innerHeight / 2 - e.clientY).toFixed(2);
        readout.innerText = `X: ${x} / Y: ${y}`;
      }
    });
  }

  private sync() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpiVal = document.getElementById('dpi-val');
    if (dpiVal) dpiVal.innerText = this.dpr.toFixed(1);

    Object.values(this.ctxs).forEach(ctx => {
      ctx.canvas.width = w * this.dpr;
      ctx.canvas.height = h * this.dpr;
      ctx.canvas.style.width = `${w}px`;
      ctx.canvas.style.height = `${h}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(this.dpr, this.dpr);
      ctx.translate(w / 2, h / 2);
    });
    this.render();
  }

  private project(x: number, y: number, z: number) {
    const cosX = Math.cos(this.rotation.x), sinX = Math.sin(this.rotation.x);
    const cosY = Math.cos(this.rotation.y), sinY = Math.sin(this.rotation.y);
    const tx = x * cosY - z * sinY;
    const tz = x * sinY + z * cosY;
    const ty = y * cosX - tz * sinX;
    const finalZ = y * sinX + tz * cosX;
    const scale = this.fov / (this.fov + finalZ);
    return { x: tx * scale, y: -ty * scale, z: finalZ };
  }

  private verifySession() {
    if (this.sessionShots.length < 3) {
      console.log(`Awaiting Control: ${this.sessionShots.length}/3`);
      return;
    }

    let totalVariance = 0;
    
    this.sessionShots.forEach((shot, index) => {
      const truth = this.benchmarks.find(b => b.id === shot.id) || this.benchmarks[index];
      const dx = shot.x - truth.x;
      const dy = shot.y - truth.y;
      const dz = shot.z - truth.z;
      totalVariance += (dx * dx + dy * dy + dz * dz);
    });

    const sigma = Math.sqrt(totalVariance / this.sessionShots.length);

    if (sigma < 0.005) { 
      this.isCalibrated = true;
      console.log(`LSA Converged. Sigma: ${sigma.toFixed(4)}m`);
      this.sync(); 
    } else {
      console.warn(`Statistical Outlier: ${sigma.toFixed(4)}m. Check instrument level.`);
    }
  }

  private isVisible(p: { x: number; y: number; z: number }, checkBubbleBoundary: boolean = true) {
    if (!checkBubbleBoundary) {
      return p.z > -this.fov; // Only clip objects completely behind the camera viewport
    }
    const distance = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
    return p.z > -this.fov && distance < this.bubbleRadius;
  }

  private draw3DGrid() {
    const ctx = this.ctxs['grid-layer'];
    const size = 600;
    const step = 50;
    ctx.strokeStyle = '#1A4D2E';
    ctx.lineWidth = 0.5;

    for (let i = -size; i <= size; i += step) {
      // Pass false to bypass bubble culling so the spatial grid can draw smoothly
      this.drawLine(ctx, i, 0, -size, i, 0, size, false);
      this.drawLine(ctx, -size, 0, i, size, 0, i, false);
    }
  }

  private drawLine(
    ctx: CanvasRenderingContext2D, 
    x1: number, y1: number, z1: number, 
    x2: number, y2: number, z2: number, 
    checkBubbleBoundary: boolean = true
  ) {
    const p1 = this.project(x1, y1, z1);
    const p2 = this.project(x2, y2, z2);
    if (this.isVisible(p1, checkBubbleBoundary) && this.isVisible(p2, checkBubbleBoundary)) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
  }

  private drawCalibrationFog() {
    const ctx = this.ctxs['grid-layer'];
    const w = ctx.canvas.width / this.dpr;
    const h = ctx.canvas.height / this.dpr;

    const focalX = 0;
    const focalY = -50; 

    const grad = ctx.createRadialGradient(focalX, focalY, 50, focalX, focalY, this.bubbleRadius);
    grad.addColorStop(0, 'rgba(26, 77, 46, 0.4)');
    grad.addColorStop(0.7, 'rgba(26, 77, 46, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 1)'); 

    ctx.fillStyle = grad;
    ctx.fillRect(-w / 2, -h / 2, w, h);

    this.drawHistoryFunnel(ctx);
  }

  private drawHistoryFunnel(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#82ff6f';
    this.pathHistory.forEach((point, i) => {
      const p = this.project(point.x, point.y, point.z);
      if (this.isVisible(p, true)) {
        const alpha = i / this.pathHistory.length;
        ctx.globalAlpha = alpha * 0.5;
        const size = 2 * alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
    ctx.globalAlpha = 1.0;
  }

  private render() {
    Object.values(this.ctxs).forEach(ctx => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    });

    if (!this.isCalibrated) {
      this.drawCalibrationFog(); 
    } else {
      this.draw3DGrid();
    }

    this.pathHistory.push({ ...this.station, age: 1.0 });
    if (this.pathHistory.length > this.maxHistory) {
      this.pathHistory.shift();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new ArithmaGenEngine());