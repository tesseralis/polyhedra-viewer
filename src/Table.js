import React from 'react';
import { Link } from 'react-router';
import { groups } from './data';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import './Table.css';

const Table = () => {
  return (
    <div className="Table">{
      groups.map(group => (
        <div key={group.name} className="Table-group">
          <div className="Table-groupHeader">
            <GroupHeader name={group.name} />
          </div>
          <p className="Table-groupDescription">{group.description}</p>
          <div className="Table-list">{
            group.polyhedra.map(polyhedronName => {
              const escapedName = escapeName(polyhedronName);
              const img = require(`./images/${escapedName}.png`);
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
