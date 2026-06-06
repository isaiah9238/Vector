import { Point3D } from '../core/types.js';

interface TransformationState {
  tx: number; ty: number; tz: number;
  scale: number;
  omega: number; phi: number; kappa: number;
}

/**
 * Iteratively solves the 3D Helmert Transformation using a linearized 
 * Design Matrix to accurately determine the Calibration Sigma.
 */
export const calculateCalibrationSigma = (
  shots: Point3D[], 
  benchmarks: Point3D[]
): number => {
  const n = shots.length;
  if (n < 4) {
    throw new Error("At least 4 point pairs are required for redundant 3D structural calibration.");
  }

  // Initial parameter estimates
  const state: TransformationState = { tx: 0, ty: 0, tz: 0, scale: 1.0, omega: 0, phi: 0, kappa: 0 };
  const maxIterations = 10;
  const convergenceTolerance = 1e-6;

  for (let iter = 0; iter < maxIterations; iter++) {
    // System components: Normal Equations (X^T * X) and Right-Hand Side (X^T * y)
    // Size: 7 Unknown parameters
    const AtA = Array.from({ length: 7 }, () => new Float64Array(7));
    const AtY = new Float64Array(7);

    for (let i = 0; i < n; i++) {
      const s = shots[i];
      const b = benchmarks[i];

      // 1. Compute current calculated position using small-angle rotation approximation
      const rx = s.x + state.kappa * s.y - state.phi * s.z;
      const ry = -state.kappa * s.x + s.y + state.omega * s.z;
      const rz = state.phi * s.x - state.omega * s.y + s.z;

      const calcX = state.tx + state.scale * rx;
      const calcY = state.ty + state.scale * ry;
      const calcZ = state.tz + state.scale * rz;

      // 2. Residuals vector row (Observed - Calculated)
      const dyX = b.x - calcX;
      const dyY = b.y - calcY;
      const dyZ = b.z - calcZ;

      // 3. Define the 3 rows of the Design Matrix J/X for this specific coordinate point
      const rows = [
        [1, 0, 0, s.x, 0, -s.z, s.y],  // X-coordinate sensitivities
        [0, 1, 0, s.y, s.z, 0, -s.x],  // Y-coordinate sensitivities
        [0, 0, 1, s.z, -s.y, s.x, 0]   // Z-coordinate sensitivities
      ];
      const residuals = [dyX, dyY, dyZ];

      // 4. Accumulate into Normal Equations system: AtA += X_i^T * X_i
      for (let r = 0; r < 3; r++) {
        const row = rows[r];
        const res = residuals[r];
        for (let j = 0; j < 7; j++) {
          AtY[j] += row[j] * res;
          for (let k = 0; k < 7; k++) {
            AtA[j][k] += row[j] * row[k];
          }
        }
      }
    }

    // 5. Solve the 7x7 linear system (using standard Gaussian Elimination)
    const delta = solve7x7(AtA, AtY);

    // Update parameters with the calculated corrections
    state.tx += delta[0];
    state.ty += delta[1];
    state.tz += delta[2];
    state.scale += delta[3];
    state.omega += delta[4];
    state.phi += delta[5];
    state.kappa += delta[6];

    // Check convergence criteria
    const correctionMagnitude = Math.hypot(...Array.from(delta));
    if (correctionMagnitude < convergenceTolerance) {
      break;
    }
  }

  // Final Pass: Compute Final Coordinate Residual Vector and Sigma
  let vTv = 0;
  for (let i = 0; i < n; i++) {
    const s = shots[i];
    const b = benchmarks[i];

    const rx = s.x + state.kappa * s.y - state.phi * s.z;
    const ry = -state.kappa * s.x + s.y + state.omega * s.z;
    const rz = state.phi * s.x - state.omega * s.y + s.z;

    const finalX = state.tx + state.scale * rx;
    const finalY = state.ty + state.scale * ry;
    const finalZ = state.tz + state.scale * rz;

    vTv += Math.pow(b.x - finalX, 2) + Math.pow(b.y - finalY, 2) + Math.pow(b.z - finalZ, 2);
  }

  // 3 equations per point configuration minus 7 solved parameter constraints
  const degreesOfFreedom = (3 * n) - 7;
  return Math.sqrt(vTv / degreesOfFreedom);
};

/**
 * Basic 7x7 Gaussian Elimination Solver for matrix operations
 */
const solve7x7 = (A: Float64Array[], B: Float64Array): Float64Array => {
  const n = 7;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
    }
    const tempRow = A[i]; A[i] = A[maxRow]; A[maxRow] = tempRow;
    const tempVal = B[i]; B[i] = B[maxRow]; B[maxRow] = tempVal;

    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        if (i === j) A[k][j] = 0;
        else A[k][j] += c * A[i][j];
      }
      B[k] += c * B[i];
    }
  }

  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = B[i] / A[i][i];
    for (let k = i - 1; k >= 0; k--) {
      B[k] -= A[k][i] * x[i];
    }
  }
  return x;
};