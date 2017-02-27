import _ from 'lodash';
import React, { Component } from 'react';
import { Link } from 'react-router';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import polyhedra from './data/polyhedra.json';
import './Sidebar.css';


export default class Sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: true
    }
  }

  toggle() {
    this.setState((prevState, props) => ({ visible: !prevState.visible }));
  }

  render() {
    return (
      <div className="Sidebar">
        { this.state.visible && <section className="Sidebar-content">
          <Link to="/" className="Sidebar-homeLink">Home</Link>
          { polyhedra.groups.map(group => (
            <div className="Sidebar-group" key={group.group_name}>
              <div className="Sidebar-groupHeader">
                <GroupHeader name={group.group_name} />
              </div>
              <ul className="Sidebar-list">{
                group.polyhedra.map(polyhedron => (
                  <li key={polyhedron.name} className="Sidebar-listItem">
                    <Link
                      to={escapeName(polyhedron.name)}
                      className="Sidebar-link"
                    >{_.capitalize(polyhedron.name)}</Link>
                  </li>
                ))
              }</ul>
            </div>
          )) }
        </section> }
        <button
          type="button"
          className="Sidebar-toggle"
          onClick={(e) => this.toggle(e)}
        >⋮</button>
      </div>
    );
  }
};
