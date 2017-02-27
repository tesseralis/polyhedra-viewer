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
            group.polyhedra.map(polyhedronName => {
              const escapedName = escapeName(polyhedronName);
              const img = require(`./images/s-${escapedName}.png`);
              return (
                <Link key={polyhedronName} to={escapedName} className="Table-link">
                  <img className="Table-image" src={img} alt={polyhedronName}></img>
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
