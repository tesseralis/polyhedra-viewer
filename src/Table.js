import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router';
import polyhedra from './data/polyhedra.json';
import './Table.css';

// TODO deduplicate with Sidebar.js
const displayTitles = {
  platonic: 'Platonic Solids',
  archimedean: 'Archimedean Solids',
  prisms: 'Prisms',
  antiprisms: 'Antiprisms',
  johnson: 'Johnson Solids',
};

const Table = () => {
  return (
    <div className="Table">{
      polyhedra.groups.map(group => (
        <div key={group.group_name}>
          <h2>{ displayTitles[group.group_name] }</h2>
          <div className="Table-list">{
            group.polyhedra.map(polyhedron => {
              const img = require(`./images/s-${polyhedron.name.replace(/ /g, '-')}.png`);
              return (
                <div className="Table-imageWrapper" key={polyhedron.name}>
                  <Link to={polyhedron.name.replace(/ /g, '-')}>
                    <img className="Table-image" src={img} alt={polyhedron.name}></img>
                  </Link>
                </div>
              )
            })
          }</div>
        </div>
      ))
    }</div>
  );
};

export default Table;
