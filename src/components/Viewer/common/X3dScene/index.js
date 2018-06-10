// @flow
import React from 'react';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';

export default () => {
  return (
    <X3dScene>
      <X3dPolyhedron />
    </X3dScene>
  );
};
