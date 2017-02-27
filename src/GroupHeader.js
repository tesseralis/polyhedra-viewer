import React from 'react';
import './GroupHeader.css';

const groupDisplays = {
  platonic: 'Platonic Solids',
  archimedean: 'Archimedean Solids',
  prisms: 'Prisms',
  antiprisms: 'Antiprisms',
  johnson: 'Johnson Solids',
};

const GroupHeader = ({ name }) => {
  return <h2 className="GroupHeader">{ groupDisplays[name] || 'Unknown Group' }</h2>;
};

export default GroupHeader;
