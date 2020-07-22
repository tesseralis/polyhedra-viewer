import { Polyhedron, Face } from "math/polyhedra"
import AppPage, { PageOptions } from "./AppPage"
import { escape } from "utils"

function splitListOfLists(listStr: string, outerSep: string, innerSep: string) {
  return listStr
    .split(outerSep)
    .map((inner) => inner.split(innerSep).map(parseFloat))
}

export default class ViewerPage extends AppPage {
  constructor(
    solid: string,
    panel: string = "operations",
    options: PageOptions = {},
  ) {
    super(`/${escape(solid)}/${panel}`, options)
  }

  getPolyhedron() {
    const vertexStr = this.wrapper
      .find("coordinate")
      .first()
      .prop<string>("point")
    const vertices = splitListOfLists(vertexStr, ", ", " ") as any

    const faceStr = this.wrapper
      .find("indexedfaceset")
      .prop<string>("coordindex")
    const faces = splitListOfLists(faceStr, " -1 ", " ")

    const name = this.wrapper.find("Title").text().toLowerCase()

    return new Polyhedron({ name, vertices, faces })
  }

  clickFace(face: Face) {
    const hitPnt = face.centroid().toArray()
    const shape = this.wrapper
      .find("shape")
      .filterWhere((n) => !!n.prop("onMouseMove"))
    shape.simulate("mousemove", { hitPnt })
    shape.simulate("mousedown", { hitPnt })
    shape.simulate("mouseup", { hitPnt })
    return this
  }

  clickAnyFace() {
    return this.clickFace(this.getPolyhedron().getFace())
  }

  clickFaceWithNumSides(n: number) {
    return this.clickFace(this.getPolyhedron().faceWithNumSides(n))
  }

  expectOperation(operation?: string) {
    const button = this.wrapper
      .find("OpGrid")
      .find("OpButton")
      .filterWhere((n) => !!n.prop("highlighted"))
    const actual = button.length ? button.prop("name") : ""
    expect(actual).toEqual(operation)
    return this
  }

  expectTransitionTo(expected: string) {
    this.wrapper.update()
    this.expectPath(`/${escape(expected)}/operations`)
    expect(Polyhedron.get(expected)).toSatisfy((p) =>
      this.getPolyhedron().isSame(p),
    )
    return this
  }
}
