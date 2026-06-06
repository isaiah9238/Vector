import { Point3D } from '../core/types.js';

// Matching the expected client return shape
export interface IntersectionResult {
  p1: Point3D | null;
  p2: Point3D | null;
  solutionCount: number;
}

/**
 * Computes a Bearing-Bearing intersection from two known points.
 * Implements standard analytical line intersection logic.
 */
export const computeBearingBearing = (
  p1: { x: number; y: number },
  bearing1Deg: number,
  p2: { x: number; y: number },
  bearing2Deg: number
): Point3D => {
  // Convert bearings to radians (assuming standard surveying azimuth: 0 = North, clockwise)
  const theta1 = (90 - bearing1Deg) * (Math.PI / 180);
  const theta2 = (90 - bearing2Deg) * (Math.PI / 180);

  const m1 = Math.tan(theta1);
  const m2 = Math.tan(theta2);

  // Check for parallel lines
  if (Math.abs(m1 - m2) < 1e-9) {
    throw new Error("Lines are parallel; no unique intersection point exists.");
  }

  let x: number;
  let y: number;

  // Handle vertical line edge-cases cleanly
  if (Math.abs(Math.cos(theta1)) < 1e-9) {
    x = p1.x;
    y = m2 * (x - p2.x) + p2.y;
  } else if (Math.abs(Math.cos(theta2)) < 1e-9) {
    x = p2.x;
    y = m1 * (x - p1.x) + p1.y;
  } else {
    x = (p2.y - p1.y + m1 * p1.x - m2 * p2.x) / (m1 - m2);
    y = m1 * (x - p1.x) + p1.y;
  }

  return { x, y, z: 0 };
};

/**
 * Computes a Distance-Distance intersection (circle-circle intersection).
 * Can yield 0, 1, or 2 valid geometric positions.
 */
export const computeDistanceDistance = (
  p1: { x: number; y: number },
  r1: number,
  p2: { x: number; y: number },
  r2: number
): IntersectionResult => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const d = Math.hypot(dx, dy);

  // Check for configuration errors
  if (d > r1 + r2) return { p1: null, p2: null, solutionCount: 0 }; // Too far apart
  if (d < Math.abs(r1 - r2)) return { p1: null, p2: null, solutionCount: 0 }; // Contained inside
  if (d === 0 && r1 === r2) return { p1: null, p2: null, solutionCount: 0 }; // Concentric

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));

  // Determine chord midpoint coordinate offset
  const x2 = p1.x + (dx * a) / d;
  const y2 = p1.y + (dy * a) / d;

  // Exact singular point overlap
  if (h < 1e-9) {
    return { p1: { x: x2, y: y2, z: 0 }, p2: null, solutionCount: 1 };
  }

  // Dual intersecting solution points
  const rx = -dy * (h / d);
  const ry = dx * (h / d);

  return {
    p1: { x: x2 + rx, y: y2 + ry, z: 0 },
    p2: { x: x2 - rx, y: y2 - ry, z: 0 },
    solutionCount: 2
  };
};

/**
 * Computes a Bearing-Distance intersection (line-circle intersection).
 */
export const computeBearingDistance = (
  p1: { x: number; y: number },
  bearingDeg: number,
  p2: { x: number; y: number },
  radius: number
): IntersectionResult => {
  const theta = (90 - bearingDeg) * (Math.PI / 180);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);

  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;

  const b = 2 * (dx * cosT + dy * sinT);
  const c = dx * dx + dy * dy - radius * radius;
  const discriminant = b * b - 4 * c;

  if (discriminant < 0) {
    return { p1: null, p2: null, solutionCount: 0 }; // No intersection line missed the circle
  }

  if (Math.abs(discriminant) < 1e-9) {
    const t = -b / 2;
    return {
      p1: { x: p1.x + t * cosT, y: p1.y + t * sinT, z: 0 },
      p2: null,
      solutionCount: 1
    };
  }

  const t1 = (-b + Math.sqrt(discriminant)) / 2;
  const t2 = (-b - Math.sqrt(discriminant)) / 2;

  return {
    p1: { x: p1.x + t1 * cosT, y: p1.y + t1 * sinT, z: 0 },
    p2: { x: p1.x + t2 * cosT, y: p1.y + t2 * sinT, z: 0 },
    solutionCount: 2
  };
};