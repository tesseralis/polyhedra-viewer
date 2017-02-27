import React from 'react';
import { Link } from 'react-router';
import polyhedra from './data/polyhedra.json';
import { groupDisplay, escapeName } from './util';
import './Table.css';

const Table = () => {
  return (
    <div className="Table">{
      polyhedra.groups.map(group => (
        <div key={group.group_name}>
          <h2>{ groupDisplay(group.group_name) }</h2>
          <div className="Table-list">{
            group.polyhedra.map(polyhedron => {
              const escapedName = escapeName(polyhedron.name);
              const img = require(`./images/s-${escapedName}.png`);
              return (
                <div className="Table-imageWrapper" key={polyhedron.name}>
                  <Link to={escapedName}>
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
