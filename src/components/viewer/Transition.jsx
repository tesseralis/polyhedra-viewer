import React, { Component } from 'react'
import _ from 'lodash'
import * as d3 from 'd3-ease'
import { interpolate } from 'd3-interpolate'

export default class Transition extends Component {
  state = { currentStyle: {} }
  // on component mount, set state to animation; request animation frame to update state with new style
  render() {
    const { children } = this.props
    const { currentStyle } = this.state
    return children(currentStyle)
  }

  componentWillMount() {
    const { defaultStyle } = this.props
    this.setState({ currentStyle: defaultStyle })
    requestAnimationFrame(this.step)
  }

  // Adapted from:
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  step = timestamp => {
    const {
      duration = 1000,
      defaultStyle,
      style,
      // d3-ease function
      ease = 'easePolyInOut',
    } = this.props
    if (!this.start) this.start = timestamp
    const progress = Math.min((timestamp - this.start) / duration, 1)
    const currentStyle = interpolate(defaultStyle, style)(d3[ease](progress))
    this.setState({ currentStyle })
    if (progress < duration) {
      requestAnimationFrame(this.step)
    }
  }
}
