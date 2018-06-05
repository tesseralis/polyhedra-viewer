// @flow
import _ from 'lodash';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { mount } from 'enzyme';

import App from 'components/App';
import { Polyhedron } from 'math/polyhedra';

export default class AppPage {
  wrapper: *;

  constructor(path: string = '/') {
    this.wrapper = mount(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  }

  // Find a (not disabled) button with the given text
  findButtonWithText(text: string) {
    return this.wrapper
      .find('button')
      .filterWhere(n => n.text() === text && !n.prop('disabled'));
  }

  clickButtonWithText(text: string) {
    this.findButtonWithText(text).simulate('click');
    return this;
  }

  getPolyhedron() {
    return this.wrapper.find('HitOptions').prop('polyhedron');
  }

  clickFace(face: *) {
    const hitPnt = face.centroid().toArray();
    const shape = this.wrapper
      .find('shape')
      .filterWhere(n => !!n.prop('onMouseMove'));
    shape.simulate('mousemove', { hitPnt });
    shape.simulate('mousedown');
    shape.simulate('mouseup');
    return this;
  }

  clickAnyFace() {
    return this.clickFace(this.getPolyhedron().getFace());
  }

  clickFaceWithNumSides(n: number) {
    return this.clickFace(this.getPolyhedron().faceWithNumSides(n));
  }

  expectNoButtonWithText(text: string) {
    expect(this.findButtonWithText(text)).toHaveLength(0);
    return this;
  }

  expectOperation(operation: ?string) {
    const actual = this.wrapper.find('OperationsPanel').prop('opName');
    expect(operation).toEqual(actual);
    return this;
  }

  expectPath(path: string) {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    expect(history.location.pathname).toEqual(path);
    return this;
  }

  expectTransitionTo(expected: string) {
    // TODO do a more robust animation test
    this.wrapper.update();
    this.expectPath(`/${expected}/operations`);
    expect(this.getPolyhedron().isSame(Polyhedron.get(expected))).toBe(true);
    return this;
  }
}
