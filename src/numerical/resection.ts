import { Point3D } from '../core/types.js';

interface ResectionResult {
  position: Point3D;
  sigma: number;
}

/**
 * Computes a 3D spatial resection to find an unknown camera/sensor position
 * based on measured distances to known benchmark landmarks.
 */
export const calculateResection = (
  benchmarks: Point3D[],
  measuredDistances: number[],
  initialGuess: Point3D = { x: 0, y: 0, z: 0 }
): ResectionResult => {
  const n = benchmarks.length;
  if (n < 4) {
    throw new Error("At least 4 benchmarks are required for a redundant 3D resection adjustment.");
  }
  if (n !== measuredDistances.length) {
    throw new Error("The number of benchmarks must match the number of measured distances.");
  }

  const currentPos = { ...initialGuess };
  const maxIterations = 10;
  const convergenceTolerance = 1e-5;

  for (let iter = 0; iter < maxIterations; iter++) {
    // Normal Equations system for 3 unknowns (X, Y, Z)
    const AtA = Array.from({ length: 3 }, () => new Float64Array(3));
    const AtY = new Float64Array(3);

    for (let i = 0; i < n; i++) {
      const b = benchmarks[i];
      const obsDist = measuredDistances[i];

      // Calculate current distance from estimated position to benchmark
      const dx = b.x - currentPos.x;
      const dy = b.y - currentPos.y;
      const dz = b.z - currentPos.z;
      const calcDist = Math.hypot(dx, dy, dz);

      if (calcDist === 0) continue;

      // Residual (Observed - Calculated)
      const residual = obsDist - calcDist;

      // Partial derivatives (Design Matrix row coefficients)
      // Note the sign convention relative to shifting the unknown station point
      const dX = -dx / calcDist;
      const dY = -dy / calcDist;
      const dZ = -dz / calcDist;

      const row = [dX, dY, dZ];

      // Accumulate into Normal Equations: AtA += J^T * J
      for (let j = 0; j < 3; j++) {
        AtY[j] += row[j] * residual;
        for (let k = 0; k < 3; k++) {
          AtA[j][k] += row[j] * row[k];
        }
      }
    }

    // Solve 3x3 system using Cramer's rule or basic elimination
    const delta = solve3x3(AtA, AtY);

    // Apply corrections
    currentPos.x += delta[0];
    currentPos.y += delta[1];
    currentPos.z += delta[2];

    // Check convergence
    if (Math.hypot(...Array.from(delta)) < convergenceTolerance) {
      break;
    }
  }

  // Calculate final Sigma for the resection quality assessment
  let vTv = 0;
  for (let i = 0; i < n; i++) {
    const b = benchmarks[i];
    const finalDist = Math.hypot(b.x - currentPos.x, b.y - currentPos.y, b.z - currentPos.z);
    vTv += Math.pow(measuredDistances[i] - finalDist, 2);
  }

  const degreesOfFreedom = n - 3; // n observations minus 3 coordinate unknowns
  const sigma = Math.sqrt(vTv / degreesOfFreedom);

  return { position: currentPos, sigma };
};

/**
 * 3x3 Linear System Solver
 */
const solve3x3 = (A: Float64Array[], B: Float64Array): Float64Array => {
  const det = A[0][0] * (A[1][1] * A[2][2] - A[1][2] * A[2][1]) -
              A[0][1] * (A[1][0] * A[2][2] - A[1][2] * A[2][0]) +
              A[0][2] * (A[1][0] * A[2][1] - A[1][1] * A[2][0]);

  if (Math.abs(det) < 1e-12) {
    throw new Error("Resection matrix system is singular. Check landmark geometry layout.");
  }

  const x = new Float64Array(3);
  
  // Cramer's rule for concise 3x3 evaluation
  for (let i = 0; i < 3; i++) {
    const subA = A.map((row, rIdx) => 
      row.map((val, cIdx) => (cIdx === i ? B[rIdx] : val))
    );
    const subDet = subA[0][0] * (subA[1][1] * subA[2][2] - subA[1][2] * subA[2][1]) -
                   subA[0][1] * (subA[1][0] * subA[2][2] - subA[1][2] * subA[2][0]) +
                   subA[0][2] * (subA[1][0] * subA[2][1] - subA[1][1] * subA[2][0]);
    x[i] = subDet / det;
  }

  return x;
};