import React from "react"
import { render, screen, fireEvent, createEvent } from "@testing-library/react"

import { Point } from "types"
import { SolidData } from "math/polyhedra"
import X3dPolyhedron from "../X3dPolyhedron"
import tetrahedron from "data/polyhedra/tetrahedron.json"

let onClick: any

function renderPolyhedron() {
  onClick = jest.fn()
  render(
    <X3dPolyhedron
      value={tetrahedron as SolidData}
      colors={[]}
      onClick={onClick}
    />,
  )
}

describe("X3dPolyhedron", () => {
  function fireX3dEvent(
    node: HTMLElement,
    eventName: keyof typeof createEvent,
    hitPnt: Point,
  ) {
    const event: any = createEvent[eventName](node)
    event.hitPnt = hitPnt
    fireEvent(node, event)
  }

  it("doesn't fire a click if the mouse has been moved", () => {
    renderPolyhedron()
    const faces = screen.getByTestId("polyhedron-faces")
    fireX3dEvent(faces, "mouseDown", [0, 0, 0])
    fireX3dEvent(faces, "mouseUp", [0, 0, 1])
    expect(onClick).not.toHaveBeenCalled()

    fireX3dEvent(faces, "mouseDown", [0, 0, 0])
    fireX3dEvent(faces, "mouseMove", [0, 0, 1])
    fireX3dEvent(faces, "mouseUp", [0, 0, 0])
    expect(onClick).not.toHaveBeenCalled()

    fireX3dEvent(faces, "mouseDown", [0, 0, 0])
    fireX3dEvent(faces, "mouseUp", [0, 0, 0])
    expect(onClick).toHaveBeenCalled()
  })
})
