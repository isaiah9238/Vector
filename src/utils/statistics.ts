import { Point3D } from '../core/types';

/**
 * Calculates the Least Squares Adjustment variance for session calibration.
 */
export const calculateCalibrationSigma = (
  shots: Point3D[], 
  benchmarks: Point3D[]
): number => {
  let totalVariance = 0;
  
  shots.forEach((shot, index) => {
    // Falls back to index if specific ID matching isn't strictly required
    const truth = benchmarks[index];
    if (!truth) return;

    const dx = shot.x - truth.x;
    const dy = shot.y - truth.y;
    const dz = shot.z - truth.z;
    totalVariance += (dx * dx + dy * dy + dz * dz);
  });

  return Math.sqrt(totalVariance / shots.length);
};