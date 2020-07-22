import React from "react"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"

import { MemoryRouter, Routes, Route } from "react-router-dom"
// import Viewer from "../Viewer"
import ViewerPage from "../ViewerPage"

jest.mock("transition")

// FIXME wait for transition to occur
// FIXME enable clicking on a face

function renderViewer(solid: string) {
  return render(
    <MemoryRouter initialEntries={[`/${solid}/operations`]}>
      <Routes>
        <Route path=":solid/*" element={<ViewerPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function clickOperation(operation: string) {
  fireEvent.click(screen.getByText(operation))
}

function clickFaceWithNumSides() {
  //
}

describe("Viewer operations panel", () => {
  it("disables operations that cannot be applied to the current polyhedron", () => {
    renderViewer("tetrahedron")
    expect(screen.queryByText("diminish")).toBeDisabled()
  })

  it("unsets the operation when clicking an op button twice", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    clickOperation("augment")
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("immediately applies operations without options", () => {
    renderViewer("tetrahedron")
    clickOperation("elongate")
    expect(
      screen.queryByText("Elongated triangular pyramid"),
    ).toBeInTheDocument()
  })

  it("unsets the operation and options when choosing a different operation without options", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    clickOperation("elongate")
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  it("does not apply the operation when clicking an invalid face", () => {
    // setup("augmented-truncated-tetrahedron")
    // page.clickButtonWithText("diminish").clickFaceWithNumSides(6)
  })

  it("unsets the operation and options when there are no more valid options", () => {
    // setup("cuboctahedron")
    // page
    //   .clickButtonWithText("sharpen")
    //   .clickFaceWithNumSides(4)
    //   .expectTransitionTo("octahedron")
    //   .expectOperation("")
  })

  it("unsets the operation when clicking on a different tab", () => {
    renderViewer("tetrahedron")
    clickOperation("augment")
    fireEvent.click(screen.getByText("Options"))
    fireEvent.click(screen.getByText("Operations"))
    expect(screen.queryByText("Select a face")).not.toBeInTheDocument()
  })

  // should just be a test that twist options appear
  it("correctly displays twist operations", () => {
    renderViewer("icosahedron")
    clickOperation("snub")
    expect(screen.queryByText("left")).toBeInTheDocument()
    expect(screen.queryByText("right")).toBeInTheDocument()
    // TODO apply the operation
    // TODO better for `turn` which gives different polyhedra options
  })

  describe("augment options", () => {
    it("correctly displays gyrate options", () => {
      renderViewer("triangular cupola")
      clickOperation("augment")
      expect(screen.queryByText("ortho")).toBeInTheDocument()
      expect(screen.queryByText("gyro")).toBeInTheDocument()
      // TODO click on one of them and make sure it's selected
    })

    it("does not display gyrate options when unavailable", () => {
      renderViewer("square pyramid")
      clickOperation("augment")
      expect(screen.queryByText("ortho")).not.toBeInTheDocument()
      expect(screen.queryByText("gyro")).not.toBeInTheDocument()
    })

    it("correctly displays using options for cupola-rotundae", () => {
      renderViewer("pentagonal cupola")
      clickOperation("augment")
      expect(screen.queryByText("cupola")).toBeInTheDocument()
      expect(screen.queryByText("rotunda")).toBeInTheDocument()
      // TODO apply operation
    })

    it("correctly displays using options for the fastigium", () => {
      renderViewer("triangular prism")
      clickOperation("augment")
      expect(screen.queryByText("pyramid")).toBeInTheDocument()
      expect(screen.queryByText("fastigium")).toBeInTheDocument()
      // TODO apply operation
    })

    it("does not display using options when unavailable", () => {
      renderViewer("triangular cupola")
      clickOperation("augment")
      expect(screen.queryByText("cupola")).not.toBeInTheDocument()
      expect(screen.queryByText("rotunda")).not.toBeInTheDocument()
    })
  })

  describe("viewer options", () => {
    //
  })
})
