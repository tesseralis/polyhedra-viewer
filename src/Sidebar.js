import React from 'react';
import { Link } from 'react-router';
import { escapeName } from './util';
import GroupHeader from './GroupHeader';
import './Sidebar.css';

const Sidebar = ({ polyhedra }) => {
  return (
    <section className="Sidebar">{
      polyhedra.groups.map(group => (
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
                >{polyhedron.name}</Link>
              </li>
            ))
          }</ul>
        </div>
      ))
    }</section>
  );
};

export default Sidebar;
