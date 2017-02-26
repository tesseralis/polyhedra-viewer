import React, { Component } from 'react';
import 'x3dom';
import 'x3dom/x3dom.css';
import logo from './logo.svg';
import './App.css';
import Polyhedron from './Polyhedron';

class App extends Component {
  constructor() {
    super();
    this.solid = {
      "name": "tetrahedron",
      "vertices": [
                  [0.0,0.0,1.732051],
                  [1.632993,0.0,-0.5773503],
                  [-0.8164966,1.414214,-0.5773503],
                  [-0.8164966,-1.414214,-0.5773503]
                ],
      "edges": [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]],
      "faces": [[0,1,2],[0,2,3],[0,3,1],[1,3,2]]
    };
  }

  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <x3d className="X3d">
          <scene>
            <viewpoint is position="0,0,5"></viewpoint>
            <Polyhedron solid={this.solid} />
          </scene>
        </x3d>
      </div>
    );
  }
}

export default App;
