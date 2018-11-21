import React from 'react';
import X3dScene from './X3dScene';
import X3dPolyhedron from './X3dPolyhedron';

export default ({ label }: { label: string }) => {
  return (
    <X3dScene label={label}>
      <X3dPolyhedron />
    </X3dScene>
  );
};
