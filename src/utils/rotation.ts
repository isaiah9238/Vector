import { Point3D } from '../core/types';

/**
 * Rotates a point around a pivot by a given delta angle (radians).
 */
export const rotatePoint = (
  point: { x: number; y: number },
  pivot: { x: number; y: number },
  deltaAngle: number
): { x: number; y: number } => {
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  const distance = Math.hypot(dx, dy);
  const currentAngle = Math.atan2(dx, dy);
  const newAngle = currentAngle + deltaAngle;

  return {
    x: pivot.x + distance * Math.sin(newAngle),
    y: pivot.y + distance * Math.cos(newAngle)
  };
};