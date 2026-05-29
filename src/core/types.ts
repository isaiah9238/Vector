export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Rotation {
  x: number;
  y: number;
}

export type MathPoint = { x: number; y: number };

export interface LabFunction {
  isParametric?: false;
  getY: (x: number) => number | null;
  getSlope: (x: number) => number | null;
}

export interface ParametricLabFunction {
  isParametric: true;
  getX: (t: number) => number | null;
  getY: (t: number) => number | null;
  getSlopeX: (t: number) => number | null; // dx/dt
  getSlopeY: (t: number) => number | null; // dy/dt
  getTMin: () => number;
  getTMax: () => number;
}