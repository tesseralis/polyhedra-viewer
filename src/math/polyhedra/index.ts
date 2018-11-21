export { default as Polyhedron } from './Polyhedron';
export { default as Vertex } from './Vertex';
import { VertexList } from './Vertex';
export type VertexList = VertexList;
export { default as VEList } from './VEList';
export { default as Face } from './Face';
export { default as Edge } from './Edge';
export { default as Cap } from './Cap';

export * from './solidTypes';

export { normalizeVertex } from './SolidBuilder';
import { VertexArg } from './SolidBuilder';
export type VertexArg = VertexArg;
