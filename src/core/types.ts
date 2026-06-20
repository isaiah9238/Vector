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

// Add these to your existing types.ts
export interface ShelfVolume {
  id: string;
  vertices: Point3D[]; // Array of 8 corners for a 3D bounding box
  origin: Point3D;    // Local coordinate anchor for rotation/scaling
}

export interface WarehouseEnvironment {
  shelves: ShelfVolume[];
  landmarks: Point3D[]; // Trees or pillars for resection
}