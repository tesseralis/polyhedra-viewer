import React from 'react';
import { Link } from 'react-router';
import { groups } from './data/polyhedra.js';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import './Table.css';

const Table = () => {
  return (
    <div className="Table">{
      groups.map(group => (
        <div key={group.name} className="Table-group">
          <GroupHeader name={group.name} />
          <div className="Table-list">{
            group.polyhedra.map(polyhedron => {
              const escapedName = escapeName(polyhedron.name);
              const img = require(`./images/s-${escapedName}.png`);
              return (
                <Link key={polyhedron.name} to={escapedName} className="Table-link">
                  <img className="Table-image" src={img} alt={polyhedron.name}></img>
                </Link>
              )
            })
          }</div>
        </div>
      ))
    }</div>
  );
};

export default Table;
