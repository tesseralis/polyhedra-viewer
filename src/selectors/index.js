import { getAugmentGraph } from 'math/operations'
import { createSelector } from 'reselect'
export * from './config'

export const getPolyhedron = state => state.polyhedron

export const getAugments = createSelector(getPolyhedron, getAugmentGraph)

export const getOperation = state => state.controls.operation

export const getApplyOpts = state => state.controls.options
