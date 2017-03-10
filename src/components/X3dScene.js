import React, { Component } from 'react'
import { StyleSheet, css } from 'aphrodite/no-important'

// TODO put this in the webpack config when ejecting create-react-app
import x3dom from 'exports?x3dom!x3dom' // eslint-disable-line import/no-webpack-loader-syntax
import 'x3dom/x3dom.css'

import { fullScreen } from '../styles/common'

// Disable double-clicking to change rotation point
x3dom.Viewarea.prototype.onDoubleClick = () => {}

const styles = StyleSheet.create({
  x3dScene: {
    ...fullScreen,
    border: 'none',
  }
})

export default class X3dScene extends Component {
  componentDidMount() {
    // Reload X3DOM asynchronously so that it tracks the re-created instance
    setTimeout(() => x3dom.reload())
  }

  render() {
    return (
      <x3d className={css(styles.x3dScene)}>
        <scene>
          <viewpoint is position="0,0,5"></viewpoint>
          { this.props.children }
        </scene>
      </x3d>
    )
  }
}
