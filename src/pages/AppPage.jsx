import _ from 'lodash';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { mount } from 'enzyme';

import App from 'components/App';
import { Polyhedron } from 'math/polyhedra';

export default class AppPage {
  constructor(path = '/') {
    this.wrapper = mount(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
  }

  // Find a (not disabled) button with the given text
  findButtonWithText(text) {
    return this.wrapper
      .find('button')
      .filterWhere(n => n.text() === text && !n.prop('disabled'));
  }

  clickButtonWithText(text) {
    this.findButtonWithText(text).simulate('click');
    return this;
  }

  getPolyhedron() {
    return this.wrapper.find('X3dPolyhedron').prop('solidData');
  }

  clickFaceIndex(faceIndex) {
    const hitPnt = this.getPolyhedron()
      .getFace(faceIndex)
      .centroid()
      .toArray();
    const shape = this.wrapper
      .find('shape')
      .filterWhere(n => !!n.prop('onMouseMove'));
    shape.simulate('mousemove', { hitPnt });
    shape.simulate('mousedown');
    shape.simulate('mouseup');
    return this;
  }

  clickFaceWithNumSides(n) {
    const polyhedron = this.getPolyhedron();
    const fIndex = _.findIndex(polyhedron.faces, face => face.length === n);
    return this.clickFaceIndex(fIndex);
  }

  expectNoButtonWithText(text) {
    expect(this.findButtonWithText(text)).toHaveLength(0);
    return this;
  }

  expectPath(path) {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    expect(history.location.pathname).toEqual(path);
    return this;
  }

  expectTransitionTo(expected) {
    this.expectPath(`/${expected}/related`);
    const viewer = this.wrapper.find('Viewer');
    // TODO do a more robust animation test
    viewer.instance().finishAnimation();
    this.wrapper.update();
    expect(
      this.wrapper
        .find('X3dPolyhedron')
        .prop('solidData')
        .isSame(Polyhedron.get(expected)),
    ).toBe(true);
    return this;
  }
}
