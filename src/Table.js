import React from 'react';
import { Link } from 'react-router';
import polyhedra from './data/polyhedra.json';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import './Table.css';

const Table = () => {
  return (
    <div className="Table">{
      polyhedra.groups.map(group => (
        <div key={group.group_name} className="Table-group">
          <GroupHeader name={group.group_name} />
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
