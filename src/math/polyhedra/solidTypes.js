// TODO move this to a solidtypes file or something
export type Vertex = Vector;
export type VIndex = number;

export type Face = VIndex[];
export type FIndex = number;

export type Edge = [VIndex, VIndex];
export interface SolidData {
  vertices: Vertex[];
  faces: Face[];
  edges?: Edge[];
}
