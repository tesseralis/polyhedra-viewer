import React, { Component } from 'react';
import 'x3dom';
import 'x3dom/x3dom.css';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <x3d className="X3d">
          <scene>
            <shape>
              <appearance>
                {/* http://stackoverflow.com/a/33860892 */}
                <material is diffuseColor="1 0 0"></material>
              </appearance>
              <box></box>
            </shape>
          </scene>
        </x3d>
      </div>
    );
  }
}

export default App;
