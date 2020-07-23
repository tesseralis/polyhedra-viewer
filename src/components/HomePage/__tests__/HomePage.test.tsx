import React from "react"
import { render, screen } from "@testing-library/react"
import HomePage from "../HomePage"
import { BrowserRouter } from "react-router-dom"

jest.mock("components/useMediaInfo")
const { DeviceProvider } = require("components/useMediaInfo")

function renderHomePage(media: any) {
  return render(
    <DeviceProvider value={media}>
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    </DeviceProvider>,
  )
}

describe("HomePage", () => {
  it("displays the full table list on desktop", () => {
    renderHomePage({ device: "desktop" })
    expect(screen.queryByText(/Gyrate and Diminished/)).toBeInTheDocument()
  })

  it("displays split tables on mobile vertical", () => {
    renderHomePage({ device: "mobile", orientation: "portrait" })
    expect(screen.queryByText(/Bipyramids,/)).toBeInTheDocument()
    expect(screen.queryByText(/Gyrate Rhombicos/)).toBeInTheDocument()
  })
})
