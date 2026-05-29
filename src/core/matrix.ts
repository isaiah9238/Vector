import { Point3D } from './types.js';

/**
 * Basic 3x3 Matrix operations for 3D transformations.
 */
export type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export const multiplyMatrixVector = (m: Matrix3x3, v: Point3D): Point3D => {
  return {
    x: m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z,
    y: m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z,
    z: m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z,
  };
};

export const createRotationMatrix = (angleX: number, angleY: number, angleZ: number): Matrix3x3 => {
  const cx = Math.cos(angleX), sx = Math.sin(angleX);
  const cy = Math.cos(angleY), sy = Math.sin(angleY);
  const cz = Math.cos(angleZ), sz = Math.sin(angleZ);

  // Example: Standard rotation sequence
  return [
    [cy * cz, -cy * sz, sy],
    [sx * sy * cz + cx * sz, -sx * sy * sz + cx * cz, -sx * cy],
    [-cx * sy * cz + sx * sz, cx * sy * sz + sx * cz, cx * cy]
  ];
};