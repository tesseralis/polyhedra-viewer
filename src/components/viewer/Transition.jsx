import { Component } from 'react'
import _ from 'lodash'
import * as d3 from 'd3-ease'
import { interpolate } from 'd3-interpolate'

export default class Transition extends Component {
  constructor(props) {
    super(props)
    const { enabled, defaultStyle, duration } = props
    this.state = { currentStyle: defaultStyle }
    if (duration > 0) requestAnimationFrame(this.step)
  }

  // on component mount, set state to animation; request animation frame to update state with new style
  render() {
    const { children } = this.props
    const { currentStyle } = this.state
    return children(currentStyle)
  }

  componentDidUpdate(prevProps) {
    const { defaultStyle, style, duration } = this.props
    if (
      defaultStyle === prevProps.defaultStyle &&
      style === prevProps.style &&
      duration !== prevProps.duration
    ) {
      throw new Error('Attempting to change duration during current animation')
    }

    if (defaultStyle !== prevProps.defaultStyle || style !== prevProps.style) {
      if (duration > 0) {
        console.log('updating with animation')
        this.start = null
        requestAnimationFrame(this.step)
      } else {
        console.log('updating without animating')
        this.setState({ currentStyle: defaultStyle })
      }
    }
  }

  // Adapted from:
  // https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
  step = timestamp => {
    const {
      duration = 1500, // duration in milliseconds
      defaultStyle,
      style,
      onFinish = _.noop,
      // d3-ease function
      ease = 'easePolyInOut',
    } = this.props
    if (!this.start) this.start = timestamp
    const progress = Math.min((timestamp - this.start) / duration, 1)
    const currentStyle = interpolate(defaultStyle, style)(d3[ease](progress))
    this.setState({ currentStyle })
    if (progress < duration / 1000) {
      requestAnimationFrame(this.step)
    } else {
      onFinish()
    }
  }
}
