// automatic differentiation
type dual_vec3 = {
  x: number;
  dx: number;
  y: number;
  dy: number;
  z: number;
  dz: number;
}
export function dual_vec3(x: number, y: number, z: number): dual_vec3 {
  return {x, dx: 0, y, dy: 0, z, dz: 0};
}

export function dual_vec3_add(A: dual_vec3, B: dual_vec3): dual_vec3 {
  return {
    x: A.x + B.x,
    dx: A.dx + B.dx,
    y: A.y + B.y,
    dy: A.dy + B.dy,
    z: A.z + B.z,
    dz: A.dz + B.dz,
  };
}

export function dual_vec3_sub(A: dual_vec3, B: dual_vec3): dual_vec3 {
  return {
    x: A.x - B.x,
    dx: A.dx - B.dx,
    y: A.y - B.y,
    dy: A.dy - B.dy,
    z: A.z - B.z,
    dz: A.dz - B.dz,
  };
}

export function dual_vec3_mulf(A: dual_vec3, f: number): dual_vec3 {
  return {
    x: A.x * f,
    dx: A.dx * f,
    y: A.y * f,
    dy: A.dy * f,
    z: A.z * f,
    dz: A.dz * f,
  };
}

export function dual_vec3_mul(A: dual_vec3, B: dual_vec3): dual_vec3 {
  return {
    x: A.x * B.x,
    dx: A.dx * B.x + A.x * B.dx,
    y: A.y * B.y,
    dy: A.dy * B.y + A.y * B.dy,
    z: A.z * B.z,
    dz: A.dz * B.z + A.z * B.dz,
  };
}

export function dual_vec3_div(A: dual_vec3, B: dual_vec3): dual_vec3 {
  return {
    x: A.x / B.x,
    dx: (A.dx * B.x - A.x * B.dx) / (B.x * B.x),
    y: A.y / B.y,
    dy: (A.dy * B.y - A.y * B.dy) / (B.y * B.y),
    z: A.z / B.z,
    dz: (A.dz * B.z - A.z * B.dz) / (B.z * B.z),
  };
}
