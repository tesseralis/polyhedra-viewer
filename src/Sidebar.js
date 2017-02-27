import React from 'react';
import { Link } from 'react-router';
import './Sidebar.css';

// TODO have these be part of the data
const displayTitles = {
  platonic: 'Platonic Solids',
  archimedean: 'Archimedean Solids',
  prisms: 'Prisms',
  antiprisms: 'Antiprisms',
  johnson: 'Johnson Solids',
};

const Sidebar = ({ polyhedra }) => {
  return (
    <section className="Sidebar">
      {
        polyhedra.groups.map(group => (
          <div className="Sidebar-group" key={group.group_name}>
            <h2 className="Sidebar-groupHeader">{ displayTitles[group.group_name] }</h2>
            <ul className="Sidebar-list">
            {
              group.polyhedra.map(polyhedron => (
                <li key={polyhedron.name} className="Sidebar-listItem">
                  <Link to={polyhedron.name.replace(/ /g, '-')}>{polyhedron.name}</Link>
                </li>
              ))
            }
            </ul>
          </div>
        ))
      }
    </section>
  );
};

export default Sidebar;
