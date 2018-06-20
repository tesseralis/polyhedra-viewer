// @flow
import { Polyhedron } from 'math/polyhedra';
import AppPage from './AppPage';

export default class ViewerPage extends AppPage {
  constructor(solid: string, panel?: string = 'operations') {
    super(`/${solid}/${panel}`);
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
    const actual = this.wrapper.find('OpGrid').prop('opName');
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
