import { Point3D, Rotation } from './types';

export const projectPoint = (p: Point3D, rot: Rotation, fov: number): Point3D => {
  const cosX = Math.cos(rot.x), sinX = Math.sin(rot.x);
  const cosY = Math.cos(rot.y), sinY = Math.sin(rot.y);
  const tx = p.x * cosY - p.z * sinY;
  const tz = p.x * sinY + p.z * cosY;
  const ty = p.y * cosX - tz * sinX;
  const finalZ = p.y * sinX + tz * cosX;
  const scale = fov / (fov + finalZ);
  return { x: tx * scale, y: -ty * scale, z: finalZ };
};