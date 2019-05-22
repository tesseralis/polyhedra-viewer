import _ from 'lodash';
import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { SolidData } from 'math/polyhedra';
import X3dPolyhedron from '../X3dPolyhedron';
import tetrahedron from 'data/polyhedra/tetrahedron.json';

let wrapper: ReactWrapper;
let onClick: any;

function setup() {
  onClick = jest.fn();
  wrapper = mount(
    <X3dPolyhedron
      value={tetrahedron as SolidData}
      colors={[]}
      onClick={onClick}
    />,
  );
}

describe('X3dPolyhedron', () => {
  beforeEach(() => {
    setup();
  });

  it('renders', () => {
    expect(wrapper.find('Edges')).toHaveLength(1);
  });

  it("doesn't fire a click if the mouse has been moved", () => {
    setup();
    const shape = wrapper
      .find('shape')
      .filterWhere(n => !!n.prop('onMouseMove'));

    shape.simulate('mousedown', { hitPnt: [0, 0, 0] });
    shape.simulate('mouseup', { hitPnt: [0, 0, 1] });
    expect(onClick).not.toHaveBeenCalled();

    shape.simulate('mousedown', { hitPnt: [0, 0, 0] });
    shape.simulate('mousemove', { hitPnt: [0, 0, 1] });
    shape.simulate('mouseup', { hitPnt: [0, 0, 0] });
    expect(onClick).not.toHaveBeenCalled();

    shape.simulate('mousedown', { hitPnt: [0, 0, 0] });
    shape.simulate('mouseup', { hitPnt: [0, 0, 0] });
    expect(onClick).toHaveBeenCalled();
  });
});
