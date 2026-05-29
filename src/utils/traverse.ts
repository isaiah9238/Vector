import { Point3D } from '../core/types';

/**
 * Calculates a new point based on polar input (distance and angle).
 * Works for both 2D (planar) and 3D surveying applications.
 */
export const calculateTraverse = (
  origin: { x: number; y: number },
  distance: number,
  azimuthDegrees: number
): { x: number; y: number } => {
  // Convert degrees to radians for JS Math functions
  const rad = (azimuthDegrees * Math.PI) / 180;
  
  return {
    x: origin.x + distance * Math.sin(rad),
    y: origin.y + distance * Math.cos(rad)
  };
};