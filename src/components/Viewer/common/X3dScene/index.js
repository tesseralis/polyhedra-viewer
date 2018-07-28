// @flow
import React from 'react';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';

export default (props: *) => {
  return (
    <X3dScene {...props}>
      <X3dPolyhedron />
    </X3dScene>
  );
};
