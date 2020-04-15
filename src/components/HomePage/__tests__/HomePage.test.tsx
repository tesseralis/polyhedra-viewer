import React from "react"
import { render, screen } from "@testing-library/react"
import HomePage from "../HomePage"
import { BrowserRouter } from "react-router-dom"

jest.mock("components/useMediaInfo")
const { DeviceProvider } = require("components/useMediaInfo")

describe("HomePage", () => {
  it("generates a compact view on mobile vertical", () => {
    //
    render(
      <DeviceProvider value={{ device: "mobile", orientation: "portrait" }}>
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      </DeviceProvider>,
    )
    expect(screen.queryByText(/Bipyramids,/)).toBeInTheDocument()
    expect(screen.queryByText(/Gyrate Rhombicos/)).toBeInTheDocument()
  })
})
