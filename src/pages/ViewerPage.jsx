// @flow
import { Polyhedron } from 'math/polyhedra';
import AppPage from './AppPage';

export default class ViewerPage extends AppPage {
  constructor(solid: string, panel?: string = 'operations') {
    super(`/${solid}/${panel}`);
  }

  getPolyhedron() {
    // FIXME now we have no access to the polyhedron data since we use hooks everywhere
    const solidData = this.wrapper.find('X3dPolyhedron').prop('solidData');
    return new Polyhedron(solidData);
  }

  clickFace(face: *) {
    const hitPnt = face.centroid().toArray();
    const shape = this.wrapper
      .find('shape')
      .filterWhere(n => !!n.prop('onMouseMove'));
    shape.simulate('mousemove', { hitPnt });
    shape.simulate('mousedown', { hitPnt });
    shape.simulate('mouseup', { hitPnt });
    return this;
  }

  clickAnyFace() {
    return this.clickFace(this.getPolyhedron().getFace());
  }

  clickFaceWithNumSides(n: number) {
    return this.clickFace(this.getPolyhedron().faceWithNumSides(n));
  }

  expectOperation(operation: ?string) {
    const button = this.wrapper
      .find('OpGrid')
      .find('OpButton')
      .filterWhere(n => !!n.prop('highlighted'));
    const actual = button.length ? button.prop('name') : '';
    expect(actual).toEqual(operation);
    return this;
  }

  expectPath(path: string) {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    expect(history.location.pathname).toEqual(path);
    return this;
  }

  expectTransitionTo(expected: string) {
    this.wrapper.update();
    this.expectPath(`/${expected}/operations`);
    expect(this.getPolyhedron().isSame(Polyhedron.get(expected))).toBe(true);
    return this;
  }

  goBack() {
    const viewer = this.wrapper.find('Viewer');
    const history = viewer.prop('history');
    history.goBack();
    return this;
  }
}
