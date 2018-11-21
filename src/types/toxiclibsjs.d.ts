declare module 'toxiclibsjs/geom' {
  class Vec3D {
    constructor();
    constructor(x: number, y: number, z: number);
    constructor(v: Vec3D);
    add(a: number, b: number, c: number): Vec3D;
    add(v: Vec3D): Vec3D;
    angleBetween(v: Vec3D): number;
    angleBetween(v: Vec3D, forceNormalize: boolean): number;
    compareTo(v: Vec3D): number;
    copy(): Vec3D;
    cross(v: Vec3D): Vec3D;
    distanceTo(v: Vec3D): number;
    distanceToSquared(v: Vec3D): number;
    dot(v: Vec3D): number;
    equals(obj: Object): boolean;
    equalsWithTolerance(v: Vec3D, tolerance: number): boolean;
    getAbs(): Vec3D;
    getComponent(id: number): number;
    // getComponent(id: Vec3D.Axis): number;
    // getConstrained(box: AABB): Vec3D;
    getFloored(): Vec3D;
    getFrac(): Vec3D;
    getInverted(): Vec3D;
    getLimited(lim: number): Vec3D;
    getNormalized(): Vec3D;
    getNormalizedTo(length: number): Vec3D;
    getReciprocal(): Vec3D;
    getReflected(normal: Vec3D): Vec3D;
    getRotatedAroundAxis(axis: Vec3D, theta: number): Vec3D;
    getRotatedX(theta: number): Vec3D;
    getRotatedY(theta: number): Vec3D;
    getRotatedZ(theta: number): Vec3D;
    getSignum(): Vec3D;
    headingXY(): number;
    headingXZ(): number;
    headingYZ(): number;
    interpolateTo(v: Vec3D, f: number): Vec3D;
    // interpolateTo(v: Vec3D, f: number, s: InterpolateStrategy): Vec3D
    // isInAABB(box: AABB): boolean
    // isInAABB(boxOrigin: AABB, boxExtent: Vec3D): boolean
    isMajorAxis(tolerance: number): boolean;
    isZeroVector(): boolean;
    magnitude(): number;
    magSquared(): number;
    scale(s: number): Vec3D;
    scale(a: number, b: number, c: number): Vec3D;
    scale(s: Vec3D): Vec3D;
    sub(a: number, b: number, c: number): Vec3D;
    sub(v: Vec3D): Vec3D;
    // to2DXY(): Vec2D;
    // to2DXZ(): Vec2D;
    // to2DYZ(): Vec2D;
    toArray(): [number, number, number];
    toCartesian(): Vec3D;
    toSpherical(): Vec3D;
    x: number;
    y: number;
    z: number;
  }

  class Plane extends Vec3D {
    constructor();
    constructor(t: Triangle3D);
    constructor(origin: Vec3D, norm: Vec3D);
    // classifyPoint(p: Vec3D, tolerance: float)
    containsPoint(p: Vec3D): boolean;
    getDistanceToPoint(p: Vec3D): number;
    getIntersectionWithRay(r: Ray3D): Vec3D;
    getProjectedPoint(p: Vec3D): Vec3D;
    intersectRayDistance(ray: Ray3D): number;
    // toMesh(float size): Mesh3D
    // toMesh(Mesh3D mesh, float size): Mesh3D
    toString(): string;
  }

  class Ray3D extends Vec3D {
    constructor();
    constructor(x: number, y: number, z: number, d: Vec3D);
    constructor(o: Vec3D, d: Vec3D);
    getDirection(): Vec3D;
    getDistanceToPoint(p: Vec3D): number;
    getPointAtDistance(dist: number): Vec3D;
    // toLine3DWithPointAtDistance(dist: number): Line3D;
    toString(): string;
  }

  class Triangle3D {
    constructor();
    constructor(a: Vec3D, b: Vec3D, c: Vec3D);
  }

  class Matrix4x4 {
    constructor();
    constructor(array: number[]);
    // prettier-ignore
    constructor(
      v11: number, v12: number, v13: number, v14: number,
      v21: number, v22: number, v23: number, v24: number,
      v31: number, v32: number, v33: number, v34: number,
      v41: number, v42: number, v43: number, v44: number,
    );
    constructor(m: Matrix4x4);
    add(rhs: Matrix4x4): Matrix4x4;
    applyTo(v: Vec3D): Vec3D;
    copy(): Matrix4x4;
    getInverted(): Matrix4x4;
    getRotatedAroundAxis(axis: Vec3D, theta: number): Matrix4x4;
    getRotatedX(theta: number): Matrix4x4;
    getRotatedY(theta: number): Matrix4x4;
    getRotatedZ(theta: number): Matrix4x4;
    getTransposed(): Matrix4x4;
    identity(): Matrix4x4;
    multiply(factor: number): Matrix4x4;
    multiply(mat: Matrix4x4): Matrix4x4;
    scale(theta: number): Matrix4x4;
    scale(scaleX: number, scaleY: number, scaleZ: number): Matrix4x4;
    scale(scale: Vec3D): Matrix4x4;
    toString(): string;
    translate(dx: number, dy: number, dz: number): Matrix4x4;
    translate(trans: Vec3D): Matrix4x4;
  }
}
