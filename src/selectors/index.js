export * from './config'
export * from './filter'

export const getPolyhedron = state => state.polyhedron.data

export const getMode = state => state.controls.mode

export const getGyrateControl = state => state.controls.gyrate

export const getAugmentee = state => state.controls.augmentee
