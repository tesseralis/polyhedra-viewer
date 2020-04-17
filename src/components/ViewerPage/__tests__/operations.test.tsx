import React from "react"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

import { BrowserRouter } from "react-router-dom"
import Viewer from "../Viewer"

// FIXME wait for transition to occur
// FIXME enable clicking on a face

function renderViewer(solid: string) {
  return render(
    <BrowserRouter>
      <Viewer solid={solid} panel="operations" />
    </BrowserRouter>,
  )
}

describe("Viewer operations panel", () => {
  it("disables operations that cannot be applied to the current polyhedron", () => {
    renderViewer("tetrahedron")
    expect(screen.queryByText("diminish")).toBeDisabled()
  })

  it("unsets the operation when clicking an op button twice", () => {
    renderViewer("tetrahedron")
    fireEvent.click(screen.getByText("augment"))
    fireEvent.click(screen.getByText("augment"))
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("does not apply the operation when clicking an invalid face", () => {
    // setup("augmented-truncated-tetrahedron")
    // page.clickButtonWithText("diminish").clickFaceWithNumSides(6)
  })

  it("unsets the operation and options when choosing a different operation without options", () => {
    renderViewer("tetrahedron")
    fireEvent.click(screen.getByText("augment"))
    fireEvent.click(screen.getByText("elongate"))
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("unsets the operation and when there are no more valid options", () => {
    // setup("cuboctahedron")
    // page
    //   .clickButtonWithText("sharpen")
    //   .clickFaceWithNumSides(4)
    //   .expectTransitionTo("octahedron")
    //   .expectOperation("")
  })

  xit("unsets the operation when clicking on a different tab", () => {
    renderViewer("tetrahedron")
    fireEvent.click(screen.getByText("augment"))
    fireEvent.click(screen.getByText("Options"))
    // FIXME
    // fireEvent.click(screen.getByText("Operations"))
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("shows options on snub only when chiral options are available", () => {
    // renderViewer("tetrahedron")
    // fireEvent.click(screen.getByText("snub"))
    // expect(screen.queryByText("icosahedron")).toBeInTheDocument()
    renderViewer("icosahedron")
    fireEvent.click(screen.getByText("snub"))
    expect(screen.queryByText("left")).toBeInTheDocument()
  })

  // FIXME implement "workflow" functions
})
