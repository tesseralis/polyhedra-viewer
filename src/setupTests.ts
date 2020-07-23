import "@testing-library/jest-dom"
import { StyleSheetTestUtils } from "aphrodite"
import "jest-extended"

StyleSheetTestUtils.suppressStyleInjection()

jest.mock("x3domWrapper.ts")
