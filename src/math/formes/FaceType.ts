import { PrimaryPolygon, FacetType, PolygonType, PrismaticType } from "specs"

interface BaseClassical {
  type: "classical"
  family: PrimaryPolygon
}

interface ClassicalFacet extends BaseClassical {
  faceType: "facet"
  polygonType: PolygonType
  facet: FacetType
}

interface ClassicalEdge extends BaseClassical {
  faceType: "edge"
  expansion: PrismaticType
}

type ClassicalFace = ClassicalFacet | ClassicalEdge

export function classicalFacet(
  family: PrimaryPolygon,
  polygonType: PolygonType,
  facet: FacetType,
): ClassicalFace {
  return { type: "classical", faceType: "facet", family, polygonType, facet }
}

export function classicalEdge(
  family: PrimaryPolygon,
  expansion: PrismaticType,
): ClassicalFace {
  return { type: "classical", faceType: "edge", family, expansion }
}

interface CapstoneFace {
  type: "capstone"
  polygonType?: PolygonType
  base: 2 | PrimaryPolygon
  elongation?: PrismaticType
  capPosition?: "prism" | "top" | "side"
  sideColors?: ("top" | "middle" | "base")[]
}

export function capstoneSide(
  base: 2 | PrimaryPolygon,
  elongation: PrismaticType,
): CapstoneFace {
  return { type: "capstone", base, elongation }
}

export function capstonePrismBase(
  base: 2 | PrimaryPolygon,
  polygonType: PolygonType,
): CapstoneFace {
  return { type: "capstone", base, polygonType, capPosition: "prism" }
}

export function capstoneCapTop(
  base: 2 | PrimaryPolygon,
  polygonType: PolygonType,
): CapstoneFace {
  return { type: "capstone", base, polygonType, capPosition: "top" }
}

export function capstoneCapSide(
  base: 2 | PrimaryPolygon,
  polygonType: PolygonType,
  sideColors: ("top" | "middle" | "base")[],
): CapstoneFace {
  return {
    type: "capstone",
    base,
    polygonType,
    capPosition: "side",
    sideColors,
  }
}

export type FaceType = ClassicalFace | CapstoneFace
