// @flow
import React from 'react';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';

// FIXME this is weird... but this is only intermediate while refactoring
export default () => {
  return (
    <X3dScene>
      <X3dPolyhedron />
    </X3dScene>
  );
};
