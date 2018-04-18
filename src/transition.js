import _ from 'lodash'
import * as d3 from 'd3-ease'
import { interpolate } from 'd3-interpolate'

/**
 * An animation function based on d3's interpolate.
 * Returns an _id_ object whose `current` property is the id to call
 * cancelAnimationFrame with.
 */
export default function transition(options, updateCallback) {
  const {
    startStyle,
    endStyle,
    duration,
    ease = 'easePolyInOut',
    onFinish = _.noop,
  } = options
  let start = 0
  const id = {}
  // Adapted from:
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  const interp = interpolate(startStyle, endStyle)
  const step = timestamp => {
    if (!start) {
      start = timestamp
    }
    const delta = timestamp - start
    const progress = Math.min(delta / duration, 1)
    const currentStyle = interp(d3[ease](progress))
    updateCallback(currentStyle)
    if (delta < duration) {
      id.current = requestAnimationFrame(step)
    } else {
      onFinish()
    }
  }
  id.current = requestAnimationFrame(step)
  return id
}

