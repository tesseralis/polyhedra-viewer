import React, { Component } from 'react';
import { StyleSheet, css } from 'aphrodite/no-important';

// TODO put this in the webpack config when ejecting create-react-app
// import x3dom from 'exports-loader?x3dom!x3dom'
import 'x3dom/x3dom.css';

const { NODE_ENV } = process.env;
// eslint-disable-next-line import/no-webpack-loader-syntax
const x3dom = require(NODE_ENV === 'test'
  ? 'x3dom'
  : 'exports-loader?x3dom!x3dom');

// Disable double-clicking to change rotation point
if (x3dom.Viewarea) {
  x3dom.Viewarea.prototype.onDoubleClick = () => {};
}

const styles = StyleSheet.create({
  x3dScene: {
    border: 'none',
    height: '100%',
    width: '100%',
  },
});

export default class X3dScene extends Component {
  componentDidMount() {
    // Reload X3DOM asynchronously so that it tracks the re-created instance
    setTimeout(() => x3dom.reload());
  }

  render() {
    return (
      <x3d className={css(styles.x3dScene)}>
        <scene>
          <viewpoint position="0,0,5" />
          {this.props.children}
        </scene>
      </x3d>
    );
  }
}
