import React from 'react';
import { Link } from 'react-router';
import './Sidebar.css';

const Sidebar = ({ polyhedra }) => {
  return (
    <section className="Sidebar">
      {
        polyhedra.groups.map(group => (
          <div key={group.group_name}>
            <h2>{ group.group_name }</h2>
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
