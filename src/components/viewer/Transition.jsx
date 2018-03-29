import React, { Component } from 'react'
import _ from 'lodash'
import * as d3 from 'd3-ease'

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
      ease = 'easePolyInOut',
    } = this.props
    if (!this.start) this.start = timestamp
    var progress = Math.min((timestamp - this.start) / duration, 1)
    const currentStyle = _.mapValues(defaultStyle, (initialValue, key) => {
      const finalValue = style[key]
      return initialValue + (finalValue - initialValue) * d3[ease](progress)
    })
    console.log('setting style to', currentStyle)
    this.setState({ currentStyle })
    // element.style.left = Math.min(progress / 10, 200) + 'px'
    if (progress < duration) {
      requestAnimationFrame(this.step)
    }
  }
}
