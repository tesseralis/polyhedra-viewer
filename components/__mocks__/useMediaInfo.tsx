import { createContext, useContext } from "react"

const state = {
  device: "desktop",
  orientation: null,
}

const DeviceContext = createContext(state)
export const DeviceProvider = DeviceContext.Provider

export default function useMediaInfo() {
  return useContext(DeviceContext)
}
