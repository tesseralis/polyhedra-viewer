import { PrimaryPolygon, FacetType, PolygonType, PrismaticType } from "specs"

interface BaseClassical {
  type: "classical"
  family: PrimaryPolygon
}

interface ClassicalFacet extends BaseClassical {
  subtype: "facet"
  polygonType: PolygonType
  facet: FacetType
}

interface ClassicalEdge extends BaseClassical {
  subtype: "edge"
  expansion: PrismaticType
}

type ClassicalFace = ClassicalFacet | ClassicalEdge

export function classicalFacet(
  family: PrimaryPolygon,
  polygonType: PolygonType,
  facet: FacetType,
): ClassicalFace {
  return { type: "classical", subtype: "facet", family, polygonType, facet }
}

export function classicalEdge(
  family: PrimaryPolygon,
  expansion: PrismaticType,
): ClassicalFace {
  return { type: "classical", subtype: "edge", family, expansion }
}

interface BaseCapstone {
  type: "capstone"
  base: 2 | PrimaryPolygon
}

interface CapstoneElongation extends BaseCapstone {
  faceType: "elongation"
  elongation: PrismaticType
}

interface CapstonePrismBase extends BaseCapstone {
  faceType: "prism"
  polygonType: PolygonType
}

interface CapstoneCapTop extends BaseCapstone {
  faceType: "top"
}

interface CapstoneCapSide extends BaseCapstone {
  faceType: "side"
  sideColors: ("top" | "middle" | "base")[]
}

type CapstoneFace =
  | CapstoneElongation
  | CapstonePrismBase
  | CapstoneCapTop
  | CapstoneCapSide

export function capstoneSide(
  base: 2 | PrimaryPolygon,
  elongation: PrismaticType,
): CapstoneFace {
  return { type: "capstone", faceType: "elongation", base, elongation }
}

export function capstonePrismBase(
  base: 2 | PrimaryPolygon,
  polygonType: PolygonType,
): CapstoneFace {
  return { type: "capstone", faceType: "prism", base, polygonType }
}

export function capstoneCapTop(base: 2 | PrimaryPolygon): CapstoneFace {
  return { type: "capstone", faceType: "top", base }
}

export function capstoneCapSide(
  base: 2 | PrimaryPolygon,
  sideColors: ("top" | "middle" | "base")[],
): CapstoneFace {
  return {
    type: "capstone",
    faceType: "side",
    base,
    sideColors,
  }
}

export type FaceType = ClassicalFace | CapstoneFace
