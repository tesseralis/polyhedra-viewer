import { RefAttributes, HTMLAttributes } from 'react';
// https://github.com/Microsoft/TypeScript/issues/15449

type X3dNode = { is: string; class?: string } & RefAttributes<any> &
  HTMLAttributes<any>;
declare global {
  namespace JSX {
    interface IntrinsicElements {
      x3d: X3dNode;
      scene: X3dNode;
      viewpoint: X3dNode & { position: string };
      coordinate: X3dNode & { point: string };
      shape: X3dNode;
      indexedlineset: X3dNode & { coordindex: string };
      indexedfaceset: X3dNode & {
        coordindex: string;
        solid: string;
        colorpervertex: string;
      };
      material: X3dNode & { transparency: number };
      appearance: X3dNode;
      color: X3dNode & { color: string };
    }
  }
}
